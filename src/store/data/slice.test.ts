import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeTransaction,
  makeUser,
} from 'zerro-core/testing/zenmoneyTestData'
import type { TCommand } from 'zerro-core/infrastructure/replica/outbox'
import {
  getChangedNum,
  getHasBlockingSyncChanges,
  getLastChangeTime,
  getPendingSyncDiff,
  getPendingSyncTransport,
} from './selectors'
import reducer, {
  appendClientCommand,
  prepareClientSync,
  rebaseServerInbox,
  receiveServerPatch,
  redoClientCommand,
  restorePersistedReplica,
  undoClientCommand,
} from './slice'

function applyServerPatch(
  state: ReturnType<typeof reducer> | undefined,
  patch: Parameters<typeof receiveServerPatch>[0]
) {
  return reducer(reducer(state, receiveServerPatch(patch)), rebaseServerInbox())
}

function getRootState(state: ReturnType<typeof reducer>) {
  return { data: state } as any
}

function getPendingDiff(state: ReturnType<typeof reducer>) {
  return getPendingSyncDiff(getRootState(state))
}

function makeAccountEntry(title: string, issuedAt: number): TCommand {
  return {
    type: 'patch',
    patch: { account: [makeAccount({ id: 'cash', title })] },
    issuedAt,
  }
}

describe('command outbox boundaries', () => {
  it('applies canonical server patches with no pending commands', () => {
    const initial = reducer(undefined, { type: 'test/init' })
    const received = reducer(
      initial,
      receiveServerPatch({ serverTimestamp: 300 })
    )
    expect(received.current.serverTimestamp).toBe(0)

    const next = reducer(received, rebaseServerInbox())
    expect(next.current.serverTimestamp).toBe(300)
    expect(next.outbox).toEqual([])
  })

  it('keeps unrelated entity maps reference-stable across an append', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
      transaction: [makeTransaction({ id: 't1' })],
    })
    const beforeTransactions = base.current.transaction
    const beforeAccount = base.current.account

    const appended = reducer(
      base,
      appendClientCommand(makeAccountEntry('Wallet', 10))
    )

    expect(appended.current.account).not.toBe(beforeAccount)
    expect(appended.current.account.cash.title).toBe('Wallet')
    expect(appended.current.transaction).toBe(beforeTransactions)
  })

  it('rematerializes current and derives transport from the command prefix', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const first = makeAccountEntry('Wallet', 10)
    const second = makeAccountEntry('Vault', 20)
    const appended = reducer(
      reducer(base, appendClientCommand(first)),
      appendClientCommand(second)
    )

    expect(appended.current.account.cash.title).toBe('Vault')
    expect(getPendingDiff(appended)?.account?.[0].title).toBe('Vault')
    expect(getChangedNum(getRootState(appended))).toBe(1)
    expect(getLastChangeTime(getRootState(appended))).toBe(20)

    const undone = reducer(appended, undoClientCommand())
    expect(undone.current.account.cash.title).toBe('Wallet')
    expect(getPendingDiff(undone)?.account?.[0].title).toBe('Wallet')

    const branched = reducer(
      undone,
      appendClientCommand(makeAccountEntry('Pocket', 30))
    )
    expect(branched.outbox.map(entry => entry.issuedAt)).toEqual([10, 30])

    const reset = reducer(undone, undoClientCommand())
    expect(reset.current.account.cash.title).toBe('Cash')
    expect(getPendingDiff(reset)).toBeUndefined()

    const redone = reducer(reset, redoClientCommand())
    expect(redone.current.account.cash.title).toBe('Wallet')
  })

  it('rebases sparse transaction fields over a remote entity change', () => {
    const baseTransaction = makeTransaction({
      id: 'tr-1',
      income: 7,
      viewed: true,
      changed: 100,
    })
    const base = applyServerPatch(undefined, {
      transaction: [baseTransaction],
    })
    const entry: TCommand = {
      type: 'patch',
      patch: { transaction: [{ id: 'tr-1', viewed: false }] },
      issuedAt: 200,
    }
    const pending = reducer(base, appendClientCommand(entry))

    const rebased = applyServerPatch(pending, {
      transaction: [
        makeTransaction({
          id: 'tr-1',
          income: 11,
          viewed: true,
          changed: 300,
        }),
      ],
    })

    expect(rebased.base.transaction['tr-1'].income).toBe(11)
    expect(rebased.current.transaction['tr-1']).toMatchObject({
      income: 11,
      viewed: false,
    })
    expect(rebased.outbox).toEqual([entry])
  })

  it('acknowledges the sent prefix after a successful response', () => {
    const base = applyServerPatch(undefined, {
      transaction: [makeTransaction({ id: 'tr-1', viewed: false })],
    })
    const entry: TCommand = {
      type: 'patch',
      patch: { transaction: [{ id: 'tr-1', viewed: true }] },
      issuedAt: 10,
    }
    const pending = reducer(base, appendClientCommand(entry))

    const accepted = applyServerPatch(pending, {
      transaction: [makeTransaction({ id: 'tr-1', viewed: false })],
      sentOutboxCount: 1,
    })
    expect(accepted.outbox).toEqual([])
    expect(accepted.current.transaction['tr-1'].viewed).toBe(false)
  })

  it('acknowledges an empty comment canonicalized by ZenMoney to null', () => {
    const base = applyServerPatch(undefined, {
      transaction: [makeTransaction({ id: 'tr-1', comment: 'Before' })],
    })
    const entry: TCommand = {
      type: 'patch',
      patch: { transaction: [{ id: 'tr-1', comment: '' }] },
      issuedAt: 10,
    }
    const pending = reducer(base, appendClientCommand(entry))

    const accepted = applyServerPatch(pending, {
      transaction: [makeTransaction({ id: 'tr-1', comment: null })],
      sentOutboxCount: 1,
    })

    expect(accepted.outbox).toEqual([])
    expect(accepted.current.transaction['tr-1'].comment).toBeNull()
  })

  it('acknowledges two sent commands even when only the last value is visible', () => {
    const base = applyServerPatch(undefined, {
      transaction: [makeTransaction({ id: 'tr-1', comment: null })],
    })
    const first: TCommand = {
      type: 'patch',
      patch: { transaction: [{ id: 'tr-1', comment: 'First' }] },
      issuedAt: 10,
    }
    const second: TCommand = {
      type: 'patch',
      patch: { transaction: [{ id: 'tr-1', comment: 'Second' }] },
      issuedAt: 20,
    }
    const pending = reducer(
      reducer(base, appendClientCommand(first)),
      appendClientCommand(second)
    )

    const accepted = applyServerPatch(pending, {
      transaction: [makeTransaction({ id: 'tr-1', comment: 'Second' })],
      sentOutboxCount: 2,
    })

    expect(accepted.outbox).toEqual([])
    expect(accepted.current.transaction['tr-1'].comment).toBe('Second')
  })

  it('uses a fresh strict entity version for request transport', () => {
    const base = applyServerPatch(undefined, {
      transaction: [
        makeTransaction({ id: 'tr-1', changed: 5000, viewed: false }),
      ],
    })
    const entry: TCommand = {
      type: 'patch',
      patch: { transaction: [{ id: 'tr-1', viewed: true }] },
      issuedAt: 10,
    }
    const pending = reducer(base, appendClientCommand(entry))

    expect(
      getPendingSyncTransport(getRootState(pending), 100)?.transaction?.[0]
    ).toMatchObject({ changed: 6000, viewed: true })
  })

  it('treats sparse transaction updates and creations as rebase-safe', () => {
    const base = applyServerPatch(undefined, {
      user: [makeUser({ id: 1, parent: null, currency: 1 })],
      transaction: [makeTransaction({ id: 'tr-1', viewed: false })],
    })
    const sparse = reducer(
      base,
      appendClientCommand({
        type: 'patch',
        patch: { transaction: [{ id: 'tr-1', viewed: true }] },
        issuedAt: 10,
      })
    )
    expect(getHasBlockingSyncChanges(getRootState(sparse))).toBe(false)

    const creation = reducer(
      sparse,
      appendClientCommand({
        type: 'patch',
        patch: {
          transaction: [
            {
              id: 'tr-2',
              created: 50,
              date: '2026-01-10',
              incomeInstrument: 1,
              incomeAccount: 'cash',
              outcomeInstrument: 1,
              outcomeAccount: 'card',
            },
          ],
        },
        issuedAt: 15,
      })
    )
    expect(getHasBlockingSyncChanges(getRootState(creation))).toBe(false)
  })

  it('keeps commands created during sync and drops the committed redo tail', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const sent = makeAccountEntry('Wallet', 10)
    const during = makeAccountEntry('Vault', 20)
    const pending = reducer(
      reducer(base, appendClientCommand(sent)),
      appendClientCommand(during)
    )
    const rebased = applyServerPatch(pending, {
      account: [makeAccount({ id: 'cash', title: 'Server Wallet' })],
      sentOutboxCount: 1,
    })

    expect(rebased.outbox).toEqual([during])
    expect(rebased.current.account.cash.title).toBe('Vault')

    const withRedo = reducer(
      reducer(
        reducer(base, appendClientCommand(sent)),
        appendClientCommand(during)
      ),
      undoClientCommand()
    )
    const prepared = reducer(withRedo, prepareClientSync())
    expect(prepared.outbox).toEqual([sent])
  })

  it('restores command-only persistence only over its matching base', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const entry = makeAccountEntry('Wallet', 10)
    const persisted = {
      version: 2 as const,
      baseServerTimestamp: 100,
      outbox: [entry],
      outboxHead: 1,
    }

    const restored = reducer(base, restorePersistedReplica(persisted))
    expect(restored.current.account.cash.title).toBe('Wallet')
    expect(restored.outbox).toEqual([entry])

    const stale = reducer(
      base,
      restorePersistedReplica({ ...persisted, baseServerTimestamp: 99 })
    )
    expect(stale.current.account.cash.title).toBe('Cash')
    expect(stale.outbox).toEqual([])
  })
})
