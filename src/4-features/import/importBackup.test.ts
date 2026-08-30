import { describe, expect, it, vi } from 'vitest'
import { convertDiff, parseFullBackup } from '6-shared/api/zm-adapter'
import type { TDataStore, TNormalizedPatch } from '6-shared/types'
import type { AppDispatch, AppThunk, RootState } from 'store'
import { appendClientCommand } from 'store/data'
import { makeTestRootState } from 'store/testing'
import { applyPatch } from 'zerro-core/internal/domain/zenmoney'
import { materializeCommand } from 'zerro-core/internal/operations/materialization'
import { AccountType } from 'zerro-core/internal/domain/zenmoney/entities/accounts'
import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeTransaction,
  makeUser,
} from 'zerro-core/support/testing/zenmoneyTestData'

import {
  checkBackupCompatibility,
  importBackup,
  previewBackup,
} from './importBackup'

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }))
vi.mock('6-shared/analytics', () => ({ track: trackMock }))

const RESTORE_UUID = 'fresh-restore-id'
vi.mock('uuid', () => ({ v1: () => RESTORE_UUID }))

const rootUser = makeUser({ id: 1, parent: null, currency: 2 })
const backupCollectionKeys = [
  'instrument',
  'country',
  'company',
  'user',
  'merchant',
  'account',
  'tag',
  'budget',
  'reminder',
  'reminderMarker',
  'transaction',
]

function makeSnapshot(
  patch: Partial<TDataStore> = {},
  debtId = 'debt'
): TDataStore {
  const { account, ...rest } = patch
  return makeStore({
    instrument: {
      1: makeInstrument({ id: 1 }),
      2: makeInstrument({ id: 2 }),
    },
    country: {
      1: { id: 1, title: 'United States', currency: 1, domain: 'us' },
    },
    user: { 1: rootUser },
    ...rest,
    account: {
      [debtId]: makeAccount({
        id: debtId,
        type: AccountType.Debt,
        title: 'Debt',
      }),
      ...(account ?? {}),
    },
  })
}

/** The same file `exportJSON` writes: a full store as a ZenMoney diff. */
function toBackupFile(store: TDataStore): string {
  const patch: TNormalizedPatch = { serverTimestamp: store.serverTimestamp }
  const target = patch as Record<string, unknown>
  Object.entries(store).forEach(([key, value]) => {
    if (key === 'serverTimestamp') return
    target[key] = Object.values(value as object)
  })
  return JSON.stringify(convertDiff.toServer(patch))
}

function makeThunkRunner(initial: RootState) {
  let state = initial
  const dispatch = vi.fn((action: unknown) => {
    if (typeof action === 'function') {
      return (action as AppThunk)(
        dispatch as AppDispatch,
        () => state,
        undefined
      )
    }
    if ((action as { type?: string }).type === appendClientCommand.type) {
      const command = (action as ReturnType<typeof appendClientCommand>).payload
      state = makeTestRootState(
        applyPatch(
          state.data.current,
          materializeCommand(state.data.current, command)
        )
      )
    }
    return action
  })

  return {
    dispatch: dispatch as unknown as AppDispatch,
    commands: () =>
      dispatch.mock.calls
        .map(([action]) => action as { type?: string; payload?: unknown })
        .filter(action => action?.type === appendClientCommand.type),
    state: () => state,
  }
}

describe('parseFullBackup', () => {
  it('reads an exported backup back into the store it described', () => {
    const store = makeSnapshot({
      account: {
        acc: makeAccount({ id: 'acc', title: 'Cash', changed: 5000 }),
      },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          incomeBankID: 999,
          outcomeBankID: 998,
          outcome: 10,
          changed: 7000,
        }),
      },
    })

    const parsed = parseFullBackup(toBackupFile(store))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.store.account.acc).toMatchObject({
      id: 'acc',
      title: 'Cash',
      changed: 5000,
    })
    expect(parsed.store.transaction.tr).toMatchObject({ id: 'tr', outcome: 10 })
  })

  // Round 9: deleting an account nulls the leg that pointed at it on a debt
  // operation and soft-deletes the row. A real account can already hold that
  // shape, so an export of it has to stay importable — otherwise the backup a
  // person already has quietly stops working.
  it('reads a soft-deleted transaction whose account leg was nulled', () => {
    const withNullLeg = (deleted: boolean) =>
      makeSnapshot({
        account: { acc: makeAccount({ id: 'acc', title: 'Cash' }) },
        transaction: {
          tr: {
            ...makeTransaction({
              id: 'tr',
              incomeAccount: 'debt',
              outcomeAccount: 'acc',
              deleted,
            }),
            outcomeAccount: null,
          } as unknown as ReturnType<typeof makeTransaction>,
        },
      })

    expect(parseFullBackup(toBackupFile(withNullLeg(true))).ok).toBe(true)
    expect(parseFullBackup(toBackupFile(withNullLeg(false)))).toEqual({
      ok: false,
      reason: 'notABackup',
    })
  })

  it('rejects a file that is not JSON', () => {
    expect(parseFullBackup('not json at all')).toEqual({
      ok: false,
      reason: 'unreadable',
    })
  })

  it('rejects JSON that carries no entities', () => {
    expect(parseFullBackup('{"serverTimestamp":1}')).toEqual({
      ok: false,
      reason: 'notABackup',
    })
    expect(parseFullBackup('[1,2,3]')).toEqual({
      ok: false,
      reason: 'notABackup',
    })
    expect(parseFullBackup('{"account":"nope"}')).toEqual({
      ok: false,
      reason: 'notABackup',
    })
  })

  it('requires the complete exporter shape, including empty collections', () => {
    const complete = JSON.parse(toBackupFile(makeSnapshot())) as Record<
      string,
      unknown
    >

    backupCollectionKeys.forEach(key => {
      const incomplete = { ...complete }
      delete incomplete[key]
      expect(parseFullBackup(JSON.stringify(incomplete))).toEqual({
        ok: false,
        reason: 'notABackup',
      })
    })
  })

  it('rejects incremental diffs, deletions, malformed rows, and dangling references', () => {
    const complete = JSON.parse(toBackupFile(makeSnapshot())) as Record<
      string,
      unknown
    >
    const instruments = complete.instrument as unknown[]
    const invalidFiles = [
      { ...complete, deletion: [] },
      { ...complete, unsupportedCollection: [] },
      { ...complete, serverTimestamp: -1 },
      { ...complete, account: [{ id: 'only-an-id' }] },
      {
        ...complete,
        instrument: [...instruments, instruments[0]],
      },
      {
        ...complete,
        user: [
          {
            ...(complete.user as Array<Record<string, unknown>>)[0],
            currency: 999,
          },
        ],
      },
    ]

    invalidFiles.forEach(file => {
      expect(parseFullBackup(JSON.stringify(file))).toEqual({
        ok: false,
        reason: 'notABackup',
      })
    })
  })

  it('requires exactly one debt account in a complete backup', () => {
    const complete = JSON.parse(toBackupFile(makeSnapshot())) as Record<
      string,
      unknown
    >
    const accounts = complete.account as Array<Record<string, unknown>>
    const debt = accounts.find(account => account.type === 'debt')
    if (!debt) throw new Error('test fixture must contain a debt account')

    for (const account of [
      accounts.filter(account => account.type !== 'debt'),
      [...accounts, { ...debt, id: 'debt-2' }],
    ]) {
      expect(parseFullBackup(JSON.stringify({ ...complete, account }))).toEqual(
        {
          ok: false,
          reason: 'notABackup',
        }
      )
    }
  })
})

describe('importBackup', () => {
  const backup = makeSnapshot({
    account: { acc: makeAccount({ id: 'acc', title: 'Cash' }) },
    transaction: {
      tr: makeTransaction({
        id: 'tr',
        incomeAccount: 'acc',
        outcomeAccount: 'acc',
        outcome: 100,
      }),
    },
  })
  const drifted = makeSnapshot({
    account: { acc: makeAccount({ id: 'acc', title: 'Wallet' }) },
    transaction: {
      tr: makeTransaction({
        id: 'tr',
        incomeAccount: 'acc',
        outcomeAccount: 'acc',
        outcome: 250,
      }),
      later: makeTransaction({
        id: 'later',
        incomeAccount: 'acc',
        outcomeAccount: 'acc',
        outcome: 7,
      }),
    },
  })

  it('previews the change without writing anything', () => {
    const runner = makeThunkRunner(makeTestRootState(drifted))

    expect(runner.dispatch(previewBackup(backup))).toEqual({
      account: { created: 0, updated: 1, removed: 0 },
      transaction: { created: 0, updated: 1, removed: 1 },
    })
    expect(runner.commands()).toEqual([])
  })

  it('applies the backup as one undoable command', () => {
    const runner = makeThunkRunner(makeTestRootState(drifted))
    expect(runner.dispatch(importBackup(backup))).toEqual({
      ok: true,
      applied: true,
    })

    expect(runner.commands()).toHaveLength(1)
    const restored = runner.state().data.current
    expect(restored.account.acc.title).toBe('Cash')
    expect(restored.transaction.tr.outcome).toBe(100)
    expect(restored.transaction.later.deleted).toBe(true)
  })

  it('writes nothing when the backup matches the current data', () => {
    const runner = makeThunkRunner(makeTestRootState(backup))
    expect(runner.dispatch(importBackup(backup))).toEqual({
      ok: true,
      applied: false,
    })
    expect(runner.commands()).toEqual([])
  })

  it('allocates fresh ids at confirm time and rebuilds rather than converges on a repeat import', () => {
    const recreated = makeSnapshot({
      account: { backupAccount: makeAccount({ id: 'backupAccount' }) },
      transaction: {
        backupTransaction: makeTransaction({
          id: 'backupTransaction',
          incomeAccount: 'backupAccount',
          outcomeAccount: 'backupAccount',
          outcome: 42,
        }),
      },
    })
    const runner = makeThunkRunner(makeTestRootState(makeSnapshot()))

    expect(runner.dispatch(importBackup(recreated))).toEqual({
      ok: true,
      applied: true,
    })
    const restored = runner.state().data.current
    expect(restored.account[RESTORE_UUID]).toBeDefined()
    expect(restored.transaction[RESTORE_UUID]).toMatchObject({
      incomeAccount: RESTORE_UUID,
      outcomeAccount: RESTORE_UUID,
      outcome: 42,
    })

    // The restored account never carries the backup's own id, so a repeat
    // import cannot recognise it as already restored — it rebuilds instead
    // of converging, per the account identity rule.
    expect(runner.dispatch(importBackup(recreated))).toEqual({
      ok: true,
      applied: true,
    })
    expect(runner.commands()).toHaveLength(2)
  })

  it('imports a structurally valid backup from another account', () => {
    const foreign = makeSnapshot(
      {
        user: {
          2: makeUser({ id: 2, parent: null, currency: 2 }),
        },
        account: {
          cash: makeAccount({ id: 'backupCash', title: 'Cash' }),
        },
        transaction: {
          debtTransfer: makeTransaction({
            id: 'debtTransfer',
            incomeAccount: 'debt',
            outcomeAccount: 'backupCash',
            income: 25,
            outcome: 25,
          }),
        },
      },
      'debt'
    )
    const current = makeSnapshot(
      {
        account: {
          cash: makeAccount({ id: 'currentCash', title: 'Old cash' }),
        },
      },
      'currentDebt'
    )
    const runner = makeThunkRunner(makeTestRootState(current))

    expect(runner.dispatch(checkBackupCompatibility(foreign))).toEqual({
      ok: true,
      foreign: true,
    })
    expect(runner.dispatch(importBackup(foreign))).toEqual({
      ok: true,
      applied: true,
    })
    expect(runner.commands()).toHaveLength(1)
    expect(runner.state().data.current.account.currentDebt).toBeDefined()
    expect(runner.state().data.current.account[RESTORE_UUID]).toMatchObject({
      title: 'Cash',
    })
    expect(runner.state().data.current.transaction[RESTORE_UUID]).toMatchObject(
      {
        incomeAccount: 'currentDebt',
        outcomeAccount: RESTORE_UUID,
        income: 25,
        outcome: 25,
      }
    )
    expect(trackMock).toHaveBeenLastCalledWith('data_backup_imported', {
      foreign: true,
    })
  })

  it('restores root-user currency when its instrument is available locally', () => {
    const currencyBackup = makeSnapshot({
      user: {
        1: makeUser({ id: 1, parent: null, currency: 1 }),
      },
    })
    const runner = makeThunkRunner(makeTestRootState(makeSnapshot()))

    expect(runner.dispatch(checkBackupCompatibility(currencyBackup))).toEqual({
      ok: true,
      foreign: false,
    })
    expect(runner.dispatch(importBackup(currencyBackup))).toEqual({
      ok: true,
      applied: true,
    })
    expect(runner.state().data.current.user[1].currency).toBe(1)
  })

  it('rejects a backup that needs a missing read-only instrument', () => {
    const dictionaryMismatch = makeSnapshot({
      instrument: {
        1: makeInstrument({ id: 1 }),
        2: makeInstrument({ id: 2 }),
        9: makeInstrument({ id: 9 }),
      },
      account: {
        foreignInstrument: makeAccount({
          id: 'foreignInstrument',
          instrument: 9,
        }),
      },
    })
    const runner = makeThunkRunner(makeTestRootState(makeSnapshot()))

    expect(
      runner.dispatch(checkBackupCompatibility(dictionaryMismatch))
    ).toEqual({ ok: false, reason: 'incompatibleBackup' })
  })

  it('rejects a current replica without exactly one debt singleton', () => {
    const currentStates = [
      makeStore({ ...makeSnapshot(), account: {} }),
      makeStore({
        ...makeSnapshot(),
        account: {
          firstDebt: makeAccount({ id: 'firstDebt', type: AccountType.Debt }),
          secondDebt: makeAccount({ id: 'secondDebt', type: AccountType.Debt }),
        },
      }),
    ]

    currentStates.forEach(current => {
      const runner = makeThunkRunner(makeTestRootState(current))

      expect(runner.dispatch(checkBackupCompatibility(backup))).toEqual({
        ok: false,
        reason: 'invalidCurrentState',
      })
      expect(runner.dispatch(importBackup(backup))).toEqual({
        ok: false,
        reason: 'invalidCurrentState',
      })
      expect(runner.commands()).toEqual([])
    })
  })
})
