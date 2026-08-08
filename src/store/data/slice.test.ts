import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeTransaction,
  makeUser,
} from 'zerro-core/support/testing/zenmoneyTestData'
import { type TCommand } from 'zerro-core/replica'
import { AccountType } from '6-shared/types'
import {
  getChangedNum,
  getLastChangeTime,
  getPendingSyncDiff,
  getPendingSyncTransport,
} from './selectors'
import reducer, {
  appendClientCommand,
  hydrateReplica,
  hydrateRecoveryOutbox,
  prepareClientSync,
  rebaseServerInbox,
  receiveServerPatch,
  redoClientCommand,
  resetData,
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
  it('hydrates base and current from one reconstructed replica', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    }).base
    const outbox = [makeAccountEntry('Wallet', 10)]

    const hydrated = reducer(
      undefined,
      hydrateReplica({ rootUserId: 7, base, outbox })
    )

    expect(hydrated.rootUserId).toBe(7)
    expect(hydrated.base).toBe(base)
    expect(hydrated.current.account.cash.title).toBe('Wallet')
    expect(hydrated.outbox).toEqual(outbox)
    expect(hydrated.restoredOutboxCount).toBe(1)
  })

  it('clears recovery after the cursor-zero canonical snapshot is accepted', () => {
    const recovering = reducer(
      undefined,
      hydrateRecoveryOutbox({
        rootUserId: 7,
        outbox: [makeAccountEntry('Wallet', 10)],
        reason: 'broken checkpoint',
      })
    )

    const recovered = applyServerPatch(recovering, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })

    expect(recovered.journalRecoveryRequired).toBe(false)
    expect(recovered.journalRecoveryReason).toBeNull()
    expect(recovered.current.account.cash.title).toBe('Wallet')
  })

  it('quarantines a recovered outbox that is invalid over the full snapshot', () => {
    const recovering = reducer(
      undefined,
      hydrateRecoveryOutbox({
        rootUserId: 7,
        outbox: [
          {
            type: 'patch',
            issuedAt: 10,
            patch: { account: [{ id: 'cash', instrument: 999 }] },
          },
        ],
        reason: 'broken checkpoint',
      })
    )

    const recovered = applyServerPatch(recovering, {
      fullReload: true,
      serverTimestamp: 100,
      instrument: [makeInstrument({ id: 1 })],
      country: [{ id: 1, title: 'United States', currency: 1, domain: null }],
      user: [makeUser({ id: 7, parent: null, currency: 1 })],
      account: [
        makeAccount({ id: 'cash', user: 7, instrument: 1 }),
        makeAccount({
          id: 'debt',
          user: 7,
          instrument: 1,
          type: AccountType.Debt,
        }),
      ],
    })

    expect(recovered.outbox).toEqual([])
    expect(recovered.current).toBe(recovered.base)
    expect(recovered.outboxRecoveryReason).toContain(
      'account[0].instrument references a missing entity'
    )
    expect(recovered.journalRecoveryRequired).toBe(true)
  })

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

  it('moves commands between the durable outbox and session redo stack', () => {
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
    // Two commands touched the same account, so the count is the number of
    // undoable commands (2), not the one entity they collapse to in the diff.
    expect(getChangedNum(getRootState(appended))).toBe(2)
    expect(getLastChangeTime(getRootState(appended))).toBe(20)

    const undone = reducer(appended, undoClientCommand())
    expect(undone.current.account.cash.title).toBe('Wallet')
    expect(getPendingDiff(undone)?.account?.[0].title).toBe('Wallet')
    expect(undone.outbox).toEqual([first])
    expect(undone.redo).toEqual([second])

    const branched = reducer(
      undone,
      appendClientCommand(makeAccountEntry('Pocket', 30))
    )
    expect(branched.outbox.map(entry => entry.issuedAt)).toEqual([10, 30])
    expect(branched.redo).toEqual([])

    const reset = reducer(undone, undoClientCommand())
    expect(reset.current.account.cash.title).toBe('Cash')
    expect(getPendingDiff(reset)).toBeUndefined()

    const redone = reducer(reset, redoClientCommand())
    expect(redone.current.account.cash.title).toBe('Wallet')
    expect(redone.outbox).toEqual([first])
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
    expect(prepared.redo).toEqual([])
  })

  it('keeps the outbox over a full server reload', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const pending = reducer(
      base,
      appendClientCommand(makeAccountEntry('Wallet', 10))
    )

    const reloaded = applyServerPatch(pending, {
      fullReload: true,
      serverTimestamp: 200,
      account: [makeAccount({ id: 'cash', title: 'Server Cash' })],
    })

    expect(reloaded.base.account.cash.title).toBe('Server Cash')
    expect(reloaded.current.account.cash.title).toBe('Wallet')
    expect(reloaded.outbox).toHaveLength(1)
  })

  it('drops the previous account outbox when a full reload changes root user', () => {
    const base = makeStore({
      serverTimestamp: 100,
      user: { 7: makeUser({ id: 7, parent: null, currency: 1 }) },
      account: {
        cash: makeAccount({ id: 'cash', title: 'Cash', user: 7 }),
      },
    })
    const pending = reducer(
      reducer(undefined, hydrateReplica({ rootUserId: 7, base, outbox: [] })),
      appendClientCommand(makeAccountEntry('Wallet', 10))
    )

    const reloaded = applyServerPatch(pending, {
      fullReload: true,
      serverTimestamp: 200,
      user: [makeUser({ id: 8, parent: null, currency: 1 })],
      account: [makeAccount({ id: 'cash', title: 'Other Cash', user: 8 })],
    })

    expect(reloaded.rootUserId).toBe(8)
    expect(reloaded.outbox).toEqual([])
    expect(reloaded.redo).toEqual([])
    expect(reloaded.current.account.cash.title).toBe('Other Cash')
  })

  it('clears both history stacks when data resets on logout', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const withRedo = reducer(
      reducer(base, appendClientCommand(makeAccountEntry('Wallet', 10))),
      undoClientCommand()
    )

    const reset = reducer(withRedo, resetData())
    expect(reset.outbox).toEqual([])
    expect(reset.redo).toEqual([])
    expect(reset.current.serverTimestamp).toBe(0)
  })
})
