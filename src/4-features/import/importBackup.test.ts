import { describe, expect, it, vi } from 'vitest'
import { convertDiff, parseFullBackup } from '6-shared/api/zm-adapter'
import {
  globalBudgetTagId,
  type TDataStore,
  type TNormalizedPatch,
} from '6-shared/types'
import type { AppDispatch, AppThunk, RootState } from 'store'
import { appendClientCommand } from 'store/data'
import { makeTestRootState } from 'store/testing'
import { applyPatch } from 'zerro-core/internal/domain/zenmoney'
import { materializeCommand } from 'zerro-core/internal/operations/materialization'
import { AccountType } from 'zerro-core/internal/domain/zenmoney/entities/accounts'
import { ZERRO_DATA_ACCOUNT_NAME } from 'zerro-core/constants'
import { getEnvBudgets } from 'zerro-core/internal/domain/zerro/budgets/read'
import { EnvType, envId } from 'zerro-core/internal/domain/zerro/envelope-id'
import { getEnvelopeMeta } from 'zerro-core/internal/domain/zerro/envelope-meta'
import { getRawGoals } from 'zerro-core/internal/domain/zerro/goals/read'
import { HiddenDataType } from 'zerro-core/internal/domain/zerro/hidden-data'
import {
  makeAccount,
  makeBudget,
  makeInstrument,
  makeMerchant,
  makeReminder,
  makeReminderMarker,
  makeStore,
  makeTag,
  makeTransaction,
  makeUser,
} from 'zerro-core/support/testing/zenmoneyTestData'

import {
  checkBackupCompatibility,
  importBackup,
  previewBackup,
} from './importBackup'

const { trackMock, uuidMock } = vi.hoisted(() => ({
  trackMock: vi.fn(),
  uuidMock: vi.fn(() => 'fresh-restore-id'),
}))
vi.mock('6-shared/analytics', () => ({ track: trackMock }))

const RESTORE_UUID = 'fresh-restore-id'
vi.mock('uuid', () => ({ v1: uuidMock }))

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
  it('accepts the wire variants observed in a complete ZenMoney backup', () => {
    const file = JSON.parse(
      toBackupFile(
        makeSnapshot({
          merchant: {
            shop: makeMerchant({ id: 'shop', title: 'Shop' }),
          },
          account: {
            acc: makeAccount({ id: 'acc', title: 'Cash' }),
          },
          reminder: {
            reminder: makeReminder({
              id: 'reminder',
              incomeAccount: 'acc',
              outcomeAccount: 'acc',
            }),
          },
          transaction: {
            transaction: makeTransaction({
              id: 'transaction',
              incomeAccount: 'acc',
              outcomeAccount: 'acc',
            }),
          },
        })
      )
    ) as {
      merchant: Array<Record<string, unknown>>
      account: Array<Record<string, unknown>>
      reminder: Array<Record<string, unknown>>
      transaction: Array<Record<string, unknown>>
    }
    file.merchant[0].mcc = null
    file.account.find(account => account.id === 'acc')!.balanceCorrectionType =
      'createCorrection'
    file.reminder[0].endDate = null
    file.transaction[0].incomeBankID = 'income-operation'
    file.transaction[0].outcomeBankID = 'outcome-operation'

    const parsed = parseFullBackup(JSON.stringify(file))

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.store.account.acc.balanceCorrectionType).toBe(
      'createCorrection'
    )
    expect(parsed.store.reminder.reminder.endDate).toBeNull()
    expect(parsed.store.transaction.transaction).toMatchObject({
      incomeBankID: 'income-operation',
      outcomeBankID: 'outcome-operation',
    })
  })

  /**
   * Every warning the file itself can produce, in one backup: a collection and
   * a row field this version has no meaning for, a known field the write API
   * gives it no way to send back, and a discriminator value it does not know.
   * None of them may reject the backup.
   */
  it('reports everything it does not fully understand and still accepts', () => {
    const file = JSON.parse(
      toBackupFile(
        makeSnapshot({
          merchant: {
            first: makeMerchant({ id: 'first', title: 'First' }),
            second: makeMerchant({ id: 'second', title: 'Second' }),
          },
          account: {
            future: makeAccount({ id: 'future', title: 'Future' }),
          },
        })
      )
    ) as Record<string, Array<Record<string, unknown>>> & {
      futureCollection?: unknown
    }
    file.futureCollection = [{ id: 'one' }, { id: 'two' }]
    file.merchant.forEach(merchant => {
      merchant.futureField = true
    })
    file.merchant[0].mcc = 5411
    file.account.find(account => account.id === 'future')!.type = 'future-type'

    const parsed = parseFullBackup(JSON.stringify(file))

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.warnings).toEqual([
      { reason: 'unknownField', path: 'futureCollection', count: 2 },
      { reason: 'unknownField', path: 'merchant.futureField', count: 2 },
      { reason: 'unwritableField', path: 'merchant.mcc', count: 1 },
      { reason: 'unknownValue', path: 'account.type', count: 1 },
    ])
    expect(parsed.store.account.future.type).toBe('future-type')
  })

  it('warns about orphaned budgets and markers retained by ZenMoney', () => {
    const parsed = parseFullBackup(
      toBackupFile(
        makeSnapshot({
          account: {
            acc: makeAccount({ id: 'acc', title: 'Cash' }),
          },
          budget: {
            '2026-01-01#deleted-tag': makeBudget({
              id: '2026-01-01#deleted-tag',
              tag: 'deleted-tag',
            }),
          },
          reminderMarker: {
            marker: makeReminderMarker({
              id: 'marker',
              reminder: 'deleted-reminder',
              incomeAccount: 'acc',
              outcomeAccount: 'acc',
            }),
          },
        })
      )
    )

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.warnings).toEqual([
      {
        reason: 'danglingReference',
        path: 'budget.tag',
        count: 1,
      },
      {
        reason: 'danglingReference',
        path: 'reminderMarker.reminder',
        count: 1,
      },
    ])
  })

  it('treats the global budget tag as a valid server relation', () => {
    const parsed = parseFullBackup(
      toBackupFile(
        makeSnapshot({
          budget: {
            [`2026-01-01#${globalBudgetTagId}`]: makeBudget({
              id: `2026-01-01#${globalBudgetTagId}`,
              tag: globalBudgetTagId,
            }),
          },
        })
      )
    )

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.warnings).toEqual([])
  })

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

  it('restores and re-exports the observed ZenMoney wire variants', () => {
    const current = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', title: 'Cash' }) },
      reminder: {
        reminder: makeReminder({
          id: 'reminder',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
        }),
      },
      transaction: {
        transaction: makeTransaction({
          id: 'transaction',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
        }),
      },
    })
    const backup = makeSnapshot({
      account: {
        acc: makeAccount({
          id: 'acc',
          title: 'Cash',
          balanceCorrectionType: 'createCorrection',
        }),
      },
      reminder: {
        reminder: makeReminder({
          id: 'reminder',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          endDate: null,
        }),
      },
      transaction: {
        transaction: makeTransaction({
          id: 'transaction',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          incomeBankID: 'income-operation',
          outcomeBankID: 'outcome-operation',
        }),
      },
    })
    const runner = makeThunkRunner(makeTestRootState(current))

    expect(runner.dispatch(importBackup(backup))).toEqual({
      ok: true,
      applied: true,
    })

    const restored = runner.state().data.current
    expect(restored.account.acc.balanceCorrectionType).toBe('createCorrection')
    expect(restored.reminder.reminder.endDate).toBeNull()
    expect(restored.transaction.transaction).toMatchObject({
      incomeBankID: 'income-operation',
      outcomeBankID: 'outcome-operation',
    })
    const exported = JSON.parse(toBackupFile(restored)) as {
      account: Array<Record<string, unknown>>
      reminder: Array<Record<string, unknown>>
      transaction: Array<Record<string, unknown>>
    }
    expect(
      exported.account.find(account => account.id === 'acc')
    ).toMatchObject({ balanceCorrectionType: 'createCorrection' })
    expect(exported.reminder[0]).toMatchObject({ endDate: null })
    expect(exported.transaction[0]).toMatchObject({
      incomeBankID: 'income-operation',
      outcomeBankID: 'outcome-operation',
    })
  })

  it('writes nothing when the backup matches the current data', () => {
    const runner = makeThunkRunner(makeTestRootState(backup))
    expect(runner.dispatch(importBackup(backup))).toEqual({
      ok: true,
      applied: false,
    })
    expect(runner.commands()).toEqual([])
  })

  it('keeps same-account hidden-data comments unchanged', () => {
    const comment =
      '{ "type": "budgets", "month": "2026-08", "payload": { "tag#food": 100 } }'
    const backup = makeSnapshot({
      account: {
        data: makeAccount({ id: 'data', title: ZERRO_DATA_ACCOUNT_NAME }),
      },
      tag: { food: makeTag({ id: 'food', title: 'Food' }) },
      reminder: {
        budgets: makeReminder({
          id: 'budgets',
          incomeAccount: 'data',
          outcomeAccount: 'data',
          comment,
        }),
      },
    })
    const current = makeSnapshot({
      account: {
        data: makeAccount({ id: 'data', title: ZERRO_DATA_ACCOUNT_NAME }),
      },
      tag: { food: makeTag({ id: 'food', title: 'Food' }) },
    })
    const runner = makeThunkRunner(makeTestRootState(current))

    expect(runner.dispatch(importBackup(backup))).toEqual({
      ok: true,
      applied: true,
    })
    expect(runner.state().data.current.reminder[RESTORE_UUID].comment).toBe(
      comment
    )
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
          2: makeUser({
            id: 2,
            parent: null,
            currency: 1,
            monthStartDay: 15,
            paidTill: 999,
            subscription: 'foreign-plan',
            subscriptionRenewalDate: 'foreign-date',
          }),
        },
        account: {
          cash: makeAccount({
            id: 'backupCash',
            title: 'Cash',
            user: 2,
          }),
        },
        transaction: {
          debtTransfer: makeTransaction({
            id: 'debtTransfer',
            user: 2,
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
        user: {
          1: makeUser({
            id: 1,
            parent: null,
            currency: 2,
            monthStartDay: 1,
            paidTill: 123,
            subscription: 'current-plan',
            subscriptionRenewalDate: 'current-date',
          }),
        },
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
    expect(runner.commands()[0]).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          patch: expect.objectContaining({
            user: [{ id: 1, currency: 1, monthStartDay: 15 }],
          }),
        }),
      })
    )
    expect(runner.state().data.current.user).toEqual({
      1: expect.objectContaining({
        id: 1,
        currency: 1,
        monthStartDay: 15,
        paidTill: 123,
        subscription: 'current-plan',
        subscriptionRenewalDate: 'current-date',
      }),
    })
    expect(runner.state().data.current.account.currentDebt).toBeDefined()
    expect(runner.state().data.current.account[RESTORE_UUID]).toMatchObject({
      title: 'Cash',
      user: 1,
    })
    expect(runner.state().data.current.transaction[RESTORE_UUID]).toMatchObject(
      {
        user: 1,
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

  it('moves hidden envelope state onto newly created foreign entities', () => {
    let nextId = 0
    uuidMock.mockImplementation(() => `fresh-${++nextId}`)
    const foreignCash = 'foreign-cash'
    const foreignData = 'foreign-data'
    const foreignTag = 'foreign-tag'
    const foreignMerchant = 'foreign-merchant'
    const tagEnvelope = envId.get(EnvType.Tag, foreignTag)
    const accountEnvelope = envId.get(EnvType.Account, foreignCash)
    const merchantEnvelope = envId.get(EnvType.Merchant, foreignMerchant)
    const payeeEnvelope = envId.get(EnvType.Payee, 'Coffee shop')
    const dataReminder = (id: string, type: HiddenDataType, payload: unknown) =>
      makeReminder({
        id,
        user: 2,
        incomeAccount: foreignData,
        outcomeAccount: foreignData,
        comment: JSON.stringify({
          type,
          ...(type === HiddenDataType.Budgets || type === HiddenDataType.Goals
            ? { month: '2026-08' }
            : {}),
          payload,
        }),
      })
    const foreign = makeSnapshot({
      user: { 2: makeUser({ id: 2, parent: null, currency: 1 }) },
      account: {
        [foreignCash]: makeAccount({ id: foreignCash, user: 2, title: 'Cash' }),
        [foreignData]: makeAccount({
          id: foreignData,
          user: 2,
          title: ZERRO_DATA_ACCOUNT_NAME,
        }),
      },
      tag: {
        [foreignTag]: makeTag({
          id: foreignTag,
          user: 2,
          title: 'Food',
          color: 0x65a30d,
        }),
      },
      merchant: {
        [foreignMerchant]: makeMerchant({
          id: foreignMerchant,
          user: 2,
          title: 'Market',
        }),
      },
      reminder: {
        budgets: dataReminder('budgets', HiddenDataType.Budgets, {
          [tagEnvelope]: 100,
          [accountEnvelope]: 200,
          [merchantEnvelope]: 300,
          [payeeEnvelope]: 400,
        }),
        goals: dataReminder('goals', HiddenDataType.Goals, {
          [tagEnvelope]: { type: 'monthly', amount: 100 },
          [accountEnvelope]: { type: 'monthly', amount: 200 },
          [merchantEnvelope]: { type: 'monthly', amount: 300 },
          [payeeEnvelope]: { type: 'monthly', amount: 400 },
        }),
        envelopeMeta: dataReminder(
          'envelope-meta',
          HiddenDataType.EnvelopeMeta,
          {
            [tagEnvelope]: {
              id: tagEnvelope,
              group: 'Expenses',
              index: 3,
              visibility: 'hidden',
              parent: accountEnvelope,
              comment: 'Food budget',
              keepIncome: true,
            },
            [accountEnvelope]: {
              id: accountEnvelope,
              parent: merchantEnvelope,
            },
            [merchantEnvelope]: {
              id: merchantEnvelope,
              parent: tagEnvelope,
            },
            [payeeEnvelope]: { id: payeeEnvelope },
          }
        ),
        fxRates: dataReminder('fx-rates', HiddenDataType.FxRates, {
          USD: { rate: 1 },
        }),
        userSettings: dataReminder(
          'user-settings',
          HiddenDataType.UserSettings,
          { emojiIcons: true }
        ),
        unreadable: makeReminder({
          id: 'unreadable',
          user: 2,
          incomeAccount: foreignData,
          outcomeAccount: foreignData,
          comment: 'not hidden data',
        }),
      },
    })
    const runner = makeThunkRunner(makeTestRootState(makeSnapshot()))

    expect(() => runner.dispatch(previewBackup(foreign))).not.toThrow()
    expect(runner.dispatch(importBackup(foreign))).toEqual({
      ok: true,
      applied: true,
    })

    const restored = runner.state().data.current
    const restoredTag = Object.values(restored.tag).find(
      tag => tag.title === 'Food'
    )
    const restoredCash = Object.values(restored.account).find(
      account => account.title === 'Cash'
    )
    const restoredMerchant = Object.values(restored.merchant).find(
      merchant => merchant.title === 'Market'
    )
    expect(restoredTag).toBeDefined()
    expect(restoredCash).toBeDefined()
    expect(restoredMerchant).toBeDefined()
    if (!restoredTag || !restoredCash || !restoredMerchant) return
    expect(restoredTag.color).toBe(0x65a30d)

    const restoredTagEnvelope = envId.get(EnvType.Tag, restoredTag.id)
    const restoredAccountEnvelope = envId.get(EnvType.Account, restoredCash.id)
    const restoredMerchantEnvelope = envId.get(
      EnvType.Merchant,
      restoredMerchant.id
    )
    const budgets = getEnvBudgets(restored.reminder)
    const goals = getRawGoals(restored.reminder)
    const metadata = getEnvelopeMeta(restored.reminder)

    expect(budgets).toEqual({
      '2026-08': {
        [restoredTagEnvelope]: 100,
        [restoredAccountEnvelope]: 200,
        [restoredMerchantEnvelope]: 300,
        [payeeEnvelope]: 400,
      },
    })
    expect(goals).toEqual({
      '2026-08': {
        [restoredTagEnvelope]: { type: 'monthly', amount: 100 },
        [restoredAccountEnvelope]: { type: 'monthly', amount: 200 },
        [restoredMerchantEnvelope]: { type: 'monthly', amount: 300 },
        [payeeEnvelope]: { type: 'monthly', amount: 400 },
      },
    })
    expect(metadata).toMatchObject({
      [restoredTagEnvelope]: {
        id: restoredTagEnvelope,
        group: 'Expenses',
        index: 3,
        visibility: 'hidden',
        parent: restoredAccountEnvelope,
        comment: 'Food budget',
        keepIncome: true,
      },
      [restoredAccountEnvelope]: {
        id: restoredAccountEnvelope,
        parent: restoredMerchantEnvelope,
      },
      [restoredMerchantEnvelope]: {
        id: restoredMerchantEnvelope,
        parent: restoredTagEnvelope,
      },
      [payeeEnvelope]: { id: payeeEnvelope },
    })
    expect(
      Object.values(restored.reminder).find(reminder =>
        reminder.comment?.includes(HiddenDataType.FxRates)
      )?.comment
    ).toBe(
      JSON.stringify({
        type: HiddenDataType.FxRates,
        payload: { USD: { rate: 1 } },
      })
    )
    expect(
      Object.values(restored.reminder).find(reminder =>
        reminder.comment?.includes(HiddenDataType.UserSettings)
      )?.comment
    ).toBe(
      JSON.stringify({
        type: HiddenDataType.UserSettings,
        payload: { emojiIcons: true },
      })
    )
    expect(
      Object.values(restored.reminder).find(
        reminder => reminder.comment === 'not hidden data'
      )?.comment
    ).toBe('not hidden data')

    uuidMock.mockReturnValue(RESTORE_UUID)
  })

  it('restores root-user currency and month start when available locally', () => {
    const currencyBackup = makeSnapshot({
      user: {
        1: makeUser({
          id: 1,
          parent: null,
          currency: 1,
          monthStartDay: 15,
        }),
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
    expect(runner.state().data.current.user[1].monthStartDay).toBe(15)
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
