import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeInstrument,
  makeTransaction,
  makeUser,
} from 'zerro-core/support/testing/zenmoneyTestData'
import {
  createJournalBranch,
  journalPersistenceVersion,
  type TCommand,
  type TPersistedJournal,
} from 'zerro-core/replica'
import { AccountType } from 'zerro-core/internal/domain/zenmoney'
import {
  getChangedNum,
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
  restorePersistedJournal,
  resetData,
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
    expect(getChangedNum(getRootState(appended))).toBe(1)
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

  it('restores command-only persistence only over its matching base', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const entry = makeAccountEntry('Wallet', 10)
    const persisted = {
      version: 3 as const,
      baseServerTimestamp: 100,
      outbox: [entry],
    }

    const restored = reducer(base, restorePersistedReplica(persisted))
    expect(restored.current.account.cash.title).toBe('Wallet')
    expect(restored.outbox).toEqual([entry])
    expect(restored.redo).toEqual([])

    const stale = reducer(
      base,
      restorePersistedReplica({ ...persisted, baseServerTimestamp: 99 })
    )
    expect(stale.current.account.cash.title).toBe('Cash')
    expect(stale.outbox).toEqual([])
  })

  it('creates a journal checkpoint from legacy base data', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })

    const restored = reducer(
      base,
      restorePersistedJournal({ preserveStored: false })
    )

    expect(restored.journal).toMatchObject({
      version: journalPersistenceVersion,
      activeBranchId: 'main',
    })
    expect(restored.journal?.branches[0].checkpoint).toEqual(restored.base)
    expect(restored.journalPersistenceBlocked).toBe(false)
  })

  it('appends a canonical server point after journal initialization', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const initialized = reducer(
      base,
      restorePersistedJournal({ preserveStored: false })
    )
    const rebased = applyServerPatch(initialized, {
      serverTimestamp: 101,
      account: [makeAccount({ id: 'cash', title: 'Wallet' })],
    })

    expect(rebased.journal?.branches[0].points).toHaveLength(1)
    expect(rebased.journal?.branches[0].points[0].id).toBe('server:101')
    expect(rebased.journal?.branches[0].serverTimestamp).toBe(101)
  })

  it('replays a persisted journal as the accepted base', () => {
    const checkpoint = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    }).base
    const persisted: TPersistedJournal = {
      version: journalPersistenceVersion,
      activeBranchId: 'main',
      branches: [
        {
          ...createJournalBranch('main', checkpoint),
          serverTimestamp: 101,
          points: [
            {
              id: 'server:101',
              transition: {
                serverTimestamp: 101,
                upsert: {
                  account: [{ id: 'cash', fields: { title: 'Wallet' } }],
                },
              },
              validation: { kind: 'unknown' },
            },
          ],
        },
      ],
    }
    const loaded = reducer(
      applyServerPatch(undefined, { serverTimestamp: 0 }),
      restorePersistedJournal({ journal: persisted, preserveStored: false })
    )

    expect(loaded.base.serverTimestamp).toBe(101)
    expect(loaded.base.account.cash.title).toBe('Wallet')
    expect(loaded.current).toEqual(loaded.base)
  })

  it('quarantines an invalid journal fallback without losing the raw base', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })

    const restored = reducer(
      base,
      restorePersistedJournal({ preserveStored: true })
    )

    expect(restored.base.account.cash.title).toBe('Cash')
    expect(restored.journalPersistenceBlocked).toBe(true)
  })

  it('flags a semantically invalid active branch until a full reload', () => {
    const invalid = applyServerPatch(undefined, {
      serverTimestamp: 100,
      instrument: [makeInstrument({ id: 1 })],
      country: [{ id: 1, title: 'United States', currency: 1, domain: null }],
      user: [makeUser({ id: 1, parent: null, currency: 1 })],
      account: [
        makeAccount({ id: 'cash', type: AccountType.Cash }),
        makeAccount({ id: 'debt-1', type: AccountType.Debt }),
        makeAccount({ id: 'debt-2', type: AccountType.Debt }),
      ],
    })

    const flagged = reducer(
      invalid,
      restorePersistedJournal({ preserveStored: false })
    )

    expect(flagged.journalRecoveryRequired).toBe(true)
    expect(flagged.journalRecoveryReason).toContain('debt account')
    expect(flagged.journalPersistenceBlocked).toBe(true)

    const reloaded = applyServerPatch(flagged, {
      fullReload: true,
      serverTimestamp: 200,
      instrument: [makeInstrument({ id: 1 })],
      country: [{ id: 1, title: 'United States', currency: 1, domain: null }],
      user: [makeUser({ id: 1, parent: null, currency: 1 })],
      account: [
        makeAccount({ id: 'cash', type: AccountType.Cash }),
        makeAccount({ id: 'debt', type: AccountType.Debt }),
      ],
    })

    expect(reloaded.journalRecoveryRequired).toBe(false)
    expect(reloaded.journalRecoveryReason).toBeNull()
    expect(reloaded.journalPersistenceBlocked).toBe(false)
  })

  it('starts a sealed-history branch on a full server reload', () => {
    const base = applyServerPatch(undefined, {
      serverTimestamp: 100,
      account: [makeAccount({ id: 'cash', title: 'Cash' })],
    })
    const initialized = reducer(
      base,
      restorePersistedJournal({ preserveStored: false })
    )
    const pending = reducer(
      initialized,
      appendClientCommand(makeAccountEntry('Wallet', 10))
    )

    const reloaded = applyServerPatch(pending, {
      fullReload: true,
      serverTimestamp: 200,
      account: [makeAccount({ id: 'cash', title: 'Server Cash' })],
    })

    expect(reloaded.journal?.branches).toHaveLength(2)
    expect(reloaded.journal?.activeBranchId).toBe('reload:200')
    expect(reloaded.journal?.branches[0].id).toBe('main')
    expect(reloaded.base.account.cash.title).toBe('Server Cash')
    expect(reloaded.current.account.cash.title).toBe('Wallet')
    expect(reloaded.outbox).toHaveLength(1)
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
