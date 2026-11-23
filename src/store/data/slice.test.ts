import { testOperations } from '@/zerro-core/support/testing/commandTestData'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { configureImmer } from '../immer'

import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeTransaction,
  makeUser,
} from '@/zerro-core/support/testing/zenmoneyTestData'
import { acceptPushChunk, beginPush, type TCommand } from '@/zerro-core/replica'
import { AccountType, type TNormalizedPatch } from '@/6-shared/types'
import { getChangedNum, getPendingSyncDiff } from './selectors'
import reducer, {
  acceptClientPushChunk,
  appendClientCommand,
  hydrateReplica,
  applyServerPatch as serverPatchApplied,
  redoClientCommand,
  restoreOutboxPosition,
  resetData,
  undoClientCommand,
} from './slice'

function applyServerPatch(
  state: ReturnType<typeof reducer> | undefined,
  patch: Parameters<typeof serverPatchApplied>[0]
) {
  return reducer(state, serverPatchApplied(patch))
}

function getRootState(state: ReturnType<typeof reducer>) {
  return { data: state } as any
}

function getPendingDiff(state: ReturnType<typeof reducer>) {
  return getPendingSyncDiff(getRootState(state))
}

/** atAccept models the replica after a local command was appended during the request. */
function acknowledgePush(
  captured: ReturnType<typeof reducer>,
  canonicalPatch: TNormalizedPatch,
  atAccept: ReturnType<typeof reducer> = captured
) {
  const prepared = beginPush(captured, 100)
  if (!prepared) throw new Error('Expected a prepared push')
  const accepted = acceptPushChunk(atAccept, prepared, canonicalPatch)
  const { next: _next, progress: _progress, ...replica } = accepted
  return { state: reducer(atAccept, acceptClientPushChunk(replica)), prepared }
}

function makeAccountEntry(title: string, issuedAt: number): TCommand {
  return {
    operations: testOperations({
      account: [makeAccount({ id: 'cash', title })],
    }),
    issuedAt,
  }
}

describe.each([false, true])('outbox (production: %s)', production => {
  beforeEach(() => configureImmer(production))
  afterEach(() => configureImmer(false))

  it('keeps transaction history navigable and syncable through undo and redo', () => {
    const base = applyServerPatch(undefined, {
      transaction: [
        makeTransaction({ id: 'first' }),
        makeTransaction({ id: 'second' }),
      ],
    })
    const first = reducer(
      base,
      appendClientCommand({
        issuedAt: 100,
        operations: testOperations({
          transaction: [{ id: 'first', comment: 'First edit' }],
        }),
      })
    )
    const second = reducer(
      first,
      appendClientCommand({
        issuedAt: 200,
        operations: testOperations({
          transaction: [{ id: 'second', comment: 'Second edit' }],
        }),
      })
    )
    const undone = reducer(second, undoClientCommand())
    expect(undone.current.transaction.first.comment).toBe('First edit')
    expect(undone.current.transaction.second.comment).toBeNull()
    expect(beginPush(undone, 300)).toBeDefined()
    const redone = reducer(undone, redoClientCommand())
    expect(redone.current.transaction.second.comment).toBe('Second edit')
    expect(beginPush(redone, 300)).toBeDefined()
    const restored = reducer(redone, restoreOutboxPosition(0))
    expect(restored.current.transaction.first.comment).toBe('First edit')
    expect(restored.current.transaction.second.comment).toBeNull()
    expect(beginPush(restored, 300)).toBeDefined()
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
    expect(getChangedNum(getRootState(appended))).toBe(2)

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
      operations: testOperations({
        transaction: [{ id: 'tr-1', viewed: false }],
      }),
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
      operations: testOperations({
        transaction: [{ id: 'tr-1', viewed: true }],
      }),
      issuedAt: 10,
    }
    const pending = reducer(base, appendClientCommand(entry))

    const { state: accepted } = acknowledgePush(pending, {
      transaction: [makeTransaction({ id: 'tr-1', viewed: false })],
    })
    expect(accepted.outbox).toEqual([])
    expect(accepted.current.transaction['tr-1'].viewed).toBe(false)
  })

  it('acknowledges an empty comment canonicalized by Zenmoney to null', () => {
    const base = applyServerPatch(undefined, {
      transaction: [makeTransaction({ id: 'tr-1', comment: 'Before' })],
    })
    const entry: TCommand = {
      operations: testOperations({
        transaction: [{ id: 'tr-1', comment: '' }],
      }),
      issuedAt: 10,
    }
    const pending = reducer(base, appendClientCommand(entry))

    const { state: accepted } = acknowledgePush(pending, {
      transaction: [makeTransaction({ id: 'tr-1', comment: null })],
    })

    expect(accepted.outbox).toEqual([])
    expect(accepted.current.transaction['tr-1'].comment).toBeNull()
  })

  it('acknowledges two sent commands even when only the last value is visible', () => {
    const base = applyServerPatch(undefined, {
      transaction: [makeTransaction({ id: 'tr-1', comment: null })],
    })
    const first: TCommand = {
      operations: testOperations({
        transaction: [{ id: 'tr-1', comment: 'First' }],
      }),
      issuedAt: 10,
    }
    const second: TCommand = {
      operations: testOperations({
        transaction: [{ id: 'tr-1', comment: 'Second' }],
      }),
      issuedAt: 20,
    }
    const pending = reducer(
      reducer(base, appendClientCommand(first)),
      appendClientCommand(second)
    )

    const { state: accepted } = acknowledgePush(pending, {
      transaction: [makeTransaction({ id: 'tr-1', comment: 'Second' })],
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
      operations: testOperations({
        transaction: [{ id: 'tr-1', viewed: true }],
      }),
      issuedAt: 10,
    }
    const pending = reducer(base, appendClientCommand(entry))

    const prepared = beginPush(pending, 100)
    expect(prepared?.request.transaction?.[0]).toMatchObject({
      changed: 6000,
      viewed: true,
    })
  })

  it('keeps commands created during an in-flight push', () => {
    const base = applyServerPatch(undefined, {
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const sent = makeAccountEntry('Wallet', 10)
    const during = makeAccountEntry('Vault', 20)
    const sentOnly = reducer(base, appendClientCommand(sent))
    const { state: rebased } = acknowledgePush(
      sentOnly,
      { account: [makeAccount({ id: 'cash', title: 'Server Wallet' })] },
      reducer(sentOnly, appendClientCommand(during))
    )

    expect(rebased.outbox).toEqual([during])
    expect(rebased.current.account.cash.title).toBe('Vault')
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
      country: [{ id: 1, title: 'United States', currency: 1, domain: null }],
      instrument: [makeInstrument({ id: 1 })],
      account: [
        makeAccount({ id: 'cash', title: 'Other Cash', user: 8 }),
        makeAccount({ id: 'debt', type: AccountType.Debt, user: 8 }),
      ],
    })

    expect(reloaded.rootUserId).toBe(8)
    expect(reloaded.outbox).toEqual([])
    expect(reloaded.redo).toEqual([])
    expect(reloaded.current.account.cash.title).toBe('Other Cash')
  })

  it('clears both history stacks when data resets on logout', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const first = reducer(
      base,
      appendClientCommand(makeAccountEntry('Wallet', 10))
    )
    const withRedo = reducer(
      reducer(first, appendClientCommand(makeAccountEntry('Vault', 20))),
      undoClientCommand()
    )

    const reset = reducer(withRedo, resetData())
    expect(reset.outbox).toEqual([])
    expect(reset.redo).toEqual([])
    expect(reset.current.serverTimestamp).toBe(0)
  })
})
