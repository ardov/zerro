import { describe, expect, it } from 'vitest'

import {
  makeAccount,
  makeBudget,
  makeMerchant,
  makeReminder,
  makeReminderMarker,
  makeStore,
  makeTag,
  makeTransaction,
  makeUser,
} from '../../../support/testing/zenmoneyTestData'
import { ZERRO_DATA_ACCOUNT_NAME } from '../../../constants'
import { applyPatch } from '../../domain/zenmoney/model/applyPatch'
import type { TDataStore } from '../../domain/zenmoney/model/store'
import { AccountType } from '../../domain/zenmoney/entities/accounts'
import { HiddenDataType } from '../../domain/zerro/hidden-data'
import { issuePatch, materializeCommand } from '../materialization'
import { buildRestorePlan, diffStores, summarizeStoreDiff } from './diffStores'

const rootUser = makeUser({ id: 1, parent: null, currency: 2 })

function makeSnapshot(patch: Partial<TDataStore> = {}): TDataStore {
  return makeStore({ user: { 1: rootUser }, ...patch })
}

/** Applies a diff the way a real caller does: as an ordinary command. */
function applyDiff(current: TDataStore, desired: TDataStore): TDataStore {
  const patch = buildRestorePlan(current, desired, {
    allocateId: (key, id) => `restored:${key}:${id}`,
  }).patch
  const command = issuePatch(current, patch, 1700000000000)
  return applyPatch(current, materializeCommand(current, command))
}

describe('diffStores', () => {
  it('produces nothing for identical stores', () => {
    const store = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', title: 'Cash' }) },
      transaction: { tr: makeTransaction({ id: 'tr', outcome: 10 }) },
    })
    expect(diffStores(store, store)).toEqual({})
  })

  it('writes only the writable fields that differ', () => {
    const current = makeSnapshot({
      account: {
        acc: makeAccount({ id: 'acc', title: 'Cash', archive: false }),
      },
    })
    const desired = makeSnapshot({
      account: {
        acc: makeAccount({ id: 'acc', title: 'Wallet', archive: false }),
      },
    })
    expect(diffStores(current, desired)).toEqual({
      account: [{ id: 'acc', title: 'Wallet' }],
    })
  })

  it('maps the backup debt singleton to the current id and ignores its fields', () => {
    const current = makeSnapshot({
      account: {
        currentDebt: makeAccount({
          id: 'currentDebt',
          type: AccountType.Debt,
          title: 'Current debt container',
          balance: 10,
        }),
        cash: makeAccount({ id: 'cash' }),
      },
      transaction: {
        debtTransfer: makeTransaction({
          id: 'debtTransfer',
          incomeAccount: 'currentDebt',
          outcomeAccount: 'cash',
        }),
      },
    })
    const desired = makeSnapshot({
      account: {
        backupDebt: makeAccount({
          id: 'backupDebt',
          type: AccountType.Debt,
          title: 'A different title',
          balance: 999,
        }),
        cash: makeAccount({ id: 'cash' }),
      },
      transaction: {
        debtTransfer: makeTransaction({
          id: 'debtTransfer',
          incomeAccount: 'backupDebt',
          outcomeAccount: 'cash',
        }),
      },
    })

    const plan = buildRestorePlan(current, desired)

    expect(plan.mappings.account).toMatchObject({ backupDebt: 'currentDebt' })
    expect(plan.patch).toEqual({})
  })

  it('restores root-user currency and monthStartDay', () => {
    const current = makeSnapshot({
      user: {
        1: makeUser({
          id: 1,
          parent: null,
          currency: 2,
          monthStartDay: 1,
          paidTill: 100,
        }),
      },
    })
    const desired = makeSnapshot({
      user: {
        1: makeUser({
          id: 1,
          parent: null,
          currency: 9,
          monthStartDay: 15,
          paidTill: 999,
        }),
      },
    })

    expect(diffStores(current, desired)).toEqual({
      user: [{ id: 1, currency: 9, monthStartDay: 15 }],
    })
  })

  it('never creates a user from a restore target', () => {
    const current = makeSnapshot()
    const desired = makeSnapshot({
      user: { 2: makeUser({ id: 2, parent: null, currency: 2 }) },
    })

    expect(diffStores(current, desired)).toEqual({})
  })

  it('ignores fields the server owns', () => {
    const current = makeSnapshot({
      account: {
        acc: makeAccount({ id: 'acc', balance: 100, changed: 1 }),
      },
    })
    const desired = makeSnapshot({
      account: {
        acc: makeAccount({ id: 'acc', balance: 500, changed: 999 }),
      },
    })
    expect(diffStores(current, desired)).toEqual({})
  })

  it('treats an empty comment and null as the same value', () => {
    const current = makeSnapshot({
      transaction: { tr: makeTransaction({ id: 'tr', comment: null }) },
    })
    const desired = makeSnapshot({
      transaction: { tr: makeTransaction({ id: 'tr', comment: '' }) },
    })
    expect(diffStores(current, desired)).toEqual({})
  })

  it('creates and updates reminder markers', () => {
    const current = makeSnapshot({
      reminderMarker: {
        existing: makeReminderMarker({ id: 'existing', comment: 'Before' }),
      },
    })
    const desired = makeSnapshot({
      reminderMarker: {
        existing: makeReminderMarker({ id: 'existing', comment: 'After' }),
        created: makeReminderMarker({ id: 'created', notify: true }),
      },
    })

    expect(diffStores(current, desired)).toEqual({
      reminderMarker: [
        {
          id: '__restore__:reminderMarker:created',
          incomeInstrument: 2,
          incomeAccount: 'cash',
          income: 0,
          outcomeInstrument: 2,
          outcomeAccount: 'card',
          outcome: 0,
          tag: null,
          merchant: null,
          payee: null,
          comment: null,
          date: '2026-01-01',
          reminder: 'reminder',
          state: 'planned',
          notify: true,
        },
        { id: 'existing', comment: 'After' },
      ],
    })
  })

  it('normalizes a deleted reminder marker as absence', () => {
    const current = makeSnapshot({
      reminderMarker: {
        marker: makeReminderMarker({ id: 'marker', state: 'planned' }),
      },
    })
    const desired = makeSnapshot({
      reminderMarker: {
        marker: makeReminderMarker({ id: 'marker', state: 'deleted' }),
        absent: makeReminderMarker({ id: 'absent', state: 'deleted' }),
      },
    })

    const patch = diffStores(current, desired)
    expect(patch).toEqual({
      deletion: [{ id: 'marker', object: 'reminderMarker' }],
    })
    expect(summarizeStoreDiff(current, patch)).toEqual({
      reminderMarker: { created: 0, updated: 0, removed: 1 },
    })
  })

  it('recreates a missing row under a preview-safe fresh id', () => {
    const current = makeSnapshot()
    const desired = makeSnapshot({
      tag: { food: makeTag({ id: 'food', title: 'Food', color: 5 }) },
    })

    const patch = diffStores(current, desired)
    expect(patch.tag).toEqual([
      expect.objectContaining({
        id: '__restore__:tag:food',
        title: 'Food',
        color: 5,
      }),
    ])

    const next = applyDiff(current, desired)
    expect(next.tag['restored:tag:food']).toMatchObject({
      id: 'restored:tag:food',
      title: 'Food',
      color: 5,
    })
    expect(next.tag['restored:tag:food'].user).toBe(rootUser.id)
  })

  it('sorts ids so one pair of stores always gives one patch', () => {
    const current = makeSnapshot()
    const desired = makeSnapshot({
      tag: {
        b: makeTag({ id: 'b', title: 'B' }),
        a: makeTag({ id: 'a', title: 'A' }),
      },
    })
    expect(diffStores(current, desired).tag?.map(tag => tag.id)).toEqual([
      '__restore__:tag:a',
      '__restore__:tag:b',
    ])
  })
})

describe('diffStores removals', () => {
  it('soft-deletes a transaction missing from the desired store', () => {
    const current = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', balance: 10 }) },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          income: 10,
        }),
      },
    })
    const desired = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', balance: 0 }) },
    })

    expect(diffStores(current, desired)).toEqual({
      transaction: [{ id: 'tr', deleted: true }],
    })

    const next = applyDiff(current, desired)
    expect(next.transaction.tr.deleted).toBe(true)
    // The removal reaches the balance through the existing prediction.
    expect(next.account.acc.balance).toBe(0)
  })

  it('deletes a reminder missing from the desired store', () => {
    const current = makeSnapshot({
      reminder: { rem: makeReminder({ id: 'rem' }) },
    })
    const desired = makeSnapshot()

    expect(diffStores(current, desired)).toEqual({
      deletion: [{ id: 'rem', object: 'reminder' }],
    })
    expect(applyDiff(current, desired).reminder).toEqual({})
  })

  it('zeroes a budget missing from the desired store', () => {
    const current = makeSnapshot({
      budget: {
        '2026-01-01#food': makeBudget({
          id: '2026-01-01#food',
          outcome: 500,
        }),
      },
    })
    const desired = makeSnapshot()

    expect(diffStores(current, desired)).toEqual({
      budget: [{ id: '2026-01-01#food', outcome: 0 }],
    })
    expect(applyDiff(current, desired).budget['2026-01-01#food']).toMatchObject(
      {
        outcome: 0,
      }
    )
  })

  it('deletes ordinary accounts, merchants and tags but keeps protected rows', () => {
    const current = makeSnapshot({
      account: {
        acc: makeAccount({ id: 'acc' }),
        debt: makeAccount({ id: 'debt', type: AccountType.Debt }),
      },
      tag: { food: makeTag({ id: 'food' }) },
      merchant: { shop: makeMerchant({ id: 'shop' }) },
    })
    const desired = makeSnapshot()

    expect(diffStores(current, desired)).toEqual({
      deletion: [
        { id: 'acc', object: 'account' },
        { id: 'shop', object: 'merchant' },
        { id: 'food', object: 'tag' },
      ],
    })
    const restored = applyDiff(current, desired)
    expect(restored.account).toEqual({
      debt: current.account.debt,
    })
    expect(restored.tag).toEqual({})
    expect(restored.merchant).toEqual({})
  })

  it('keeps a merchant that an active debt transaction prevents the server deleting', () => {
    const debt = makeAccount({ id: 'debt', type: AccountType.Debt })
    const merchant = makeMerchant({ id: 'shop' })
    const transaction = makeTransaction({
      id: 'debt-transaction',
      incomeAccount: debt.id,
      outcomeAccount: 'cash',
      income: 5,
      outcome: 5,
      merchant: merchant.id,
      payee: 'Shop',
    })
    const current = makeSnapshot({
      account: { debt, cash: makeAccount({ id: 'cash' }) },
      merchant: { [merchant.id]: merchant },
      transaction: { [transaction.id]: transaction },
    })

    expect(
      diffStores(current, makeSnapshot(), { entities: ['merchant'] })
    ).toEqual({})
  })
})

describe('diffStores and the deletion ratchet', () => {
  it('recreates a desired live transaction under a fresh id after deletion', () => {
    const current = makeSnapshot({
      transaction: {
        tr: makeTransaction({ id: 'tr', deleted: true, outcome: 10 }),
      },
    })
    const desired = makeSnapshot({
      transaction: {
        tr: makeTransaction({ id: 'tr', deleted: false, outcome: 25 }),
      },
    })
    expect(diffStores(current, desired).transaction).toEqual([
      expect.objectContaining({
        id: '__restore__:transaction:tr',
        outcome: 25,
      }),
    ])
  })

  it('does not recreate a transaction that was deleted in the backup', () => {
    const current = makeSnapshot()
    const desired = makeSnapshot({
      transaction: { tr: makeTransaction({ id: 'tr', deleted: true }) },
    })
    expect(diffStores(current, desired)).toEqual({})
  })
})

describe('diffStores and account deletion cascades', () => {
  it('does not soft-delete an operation whose both legs sit inside accounts being deleted', () => {
    const current = makeSnapshot({
      account: {
        from: makeAccount({ id: 'from' }),
        to: makeAccount({ id: 'to' }),
      },
      transaction: {
        transfer: makeTransaction({
          id: 'transfer',
          incomeAccount: 'to',
          outcomeAccount: 'from',
          income: 10,
          outcome: 10,
        }),
      },
    })
    const desired = makeSnapshot()

    const patch = diffStores(current, desired)
    expect(patch.deletion).toEqual(
      expect.arrayContaining([
        { id: 'from', object: 'account' },
        { id: 'to', object: 'account' },
      ])
    )
    // The account deletions above already hard-purge it; a soft delete on
    // top would bloat the push and leave a tombstone the server never has.
    expect(patch.transaction).toBeUndefined()

    // The skipped removal must not leave a dangling row behind: the account
    // deletion's own cascade has to be what actually purges it.
    const restored = applyDiff(current, desired)
    expect(restored.account).toEqual({})
    expect(restored.transaction.transfer).toBeUndefined()
  })

  it('still soft-deletes an operation with one leg on a surviving account', () => {
    const current = makeSnapshot({
      account: {
        gone: makeAccount({ id: 'gone' }),
        stays: makeAccount({ id: 'stays' }),
      },
      transaction: {
        mixed: makeTransaction({
          id: 'mixed',
          incomeAccount: 'stays',
          outcomeAccount: 'gone',
          income: 10,
          outcome: 10,
        }),
      },
    })
    const desired = makeSnapshot({
      account: { stays: makeAccount({ id: 'stays' }) },
    })

    const patch = diffStores(current, desired)
    expect(patch.deletion).toEqual([{ id: 'gone', object: 'account' }])
    expect(patch.transaction).toEqual([{ id: 'mixed', deleted: true }])

    // Balance shifts as a side effect of the soft delete — already covered
    // elsewhere — so only presence is asserted here, not the exact balance.
    const restored = applyDiff(current, desired)
    expect(restored.account.gone).toBeUndefined()
    expect(restored.account.stays).toBeDefined()
    expect(restored.transaction.mixed.deleted).toBe(true)
  })

  it('still soft-deletes a debt operation even though its other leg is being deleted', () => {
    const current = makeSnapshot({
      account: {
        debt: makeAccount({ id: 'debt', type: AccountType.Debt }),
        gone: makeAccount({ id: 'gone' }),
      },
      transaction: {
        debtTransfer: makeTransaction({
          id: 'debtTransfer',
          incomeAccount: 'debt',
          outcomeAccount: 'gone',
          income: 10,
          outcome: 10,
        }),
      },
    })
    const desired = makeSnapshot({
      account: { debt: makeAccount({ id: 'debt', type: AccountType.Debt }) },
    })

    const patch = diffStores(current, desired)
    // The debt account is a protected singleton that never appears among
    // deletions, so a debt operation always keeps its explicit removal.
    expect(patch.deletion).toEqual([{ id: 'gone', object: 'account' }])
    expect(patch.transaction).toEqual([{ id: 'debtTransfer', deleted: true }])

    const restored = applyDiff(current, desired)
    expect(restored.account.gone).toBeUndefined()
    expect(restored.account.debt).toBeDefined()
    expect(restored.transaction.debtTransfer.deleted).toBe(true)
  })
})

describe('restore reconciliation', () => {
  const allocateId = (key: string, id: string) => `fresh:${key}:${id}`

  it('matches semantically equal rows with different backup ids', () => {
    const current = makeSnapshot({
      merchant: { live: makeMerchant({ id: 'live', title: 'Corner shop' }) },
    })
    const desired = makeSnapshot({
      merchant: {
        backup: makeMerchant({ id: 'backup', title: 'Corner shop' }),
      },
    })

    const plan = buildRestorePlan(current, desired, { allocateId })
    expect(plan.patch).toEqual({})
    expect(plan.mappings.merchant).toEqual({ backup: 'live' })
  })

  it('allocates fresh ids and rewrites dependent references in dependency order', () => {
    const current = makeSnapshot({
      account: {
        liveAccount: makeAccount({ id: 'liveAccount', title: 'Cash' }),
      },
      tag: { liveTag: makeTag({ id: 'liveTag', title: 'Food' }) },
    })
    const desired = makeSnapshot({
      account: {
        backupAccount: makeAccount({ id: 'backupAccount', title: 'Cash' }),
      },
      tag: { backupTag: makeTag({ id: 'backupTag', title: 'Food' }) },
      transaction: {
        backupTransaction: makeTransaction({
          id: 'backupTransaction',
          incomeAccount: 'backupAccount',
          outcomeAccount: 'backupAccount',
          tag: ['backupTag'],
          outcome: 42,
        }),
      },
    })

    const plan = buildRestorePlan(current, desired, { allocateId })
    // The account never matches on resemblance, even sharing every field
    // with the live one — only the tag does, per the account identity rule.
    expect(plan.mappings).toMatchObject({
      account: { backupAccount: 'fresh:account:backupAccount' },
      tag: { backupTag: 'liveTag' },
      transaction: { backupTransaction: 'fresh:transaction:backupTransaction' },
    })
    expect(plan.patch.account).toEqual([
      expect.objectContaining({
        id: 'fresh:account:backupAccount',
        title: 'Cash',
      }),
    ])
    expect(plan.patch.transaction).toEqual([
      expect.objectContaining({
        id: 'fresh:transaction:backupTransaction',
        incomeAccount: 'fresh:account:backupAccount',
        outcomeAccount: 'fresh:account:backupAccount',
        tag: ['liveTag'],
      }),
    ])
    expect(plan.patch.deletion).toContainEqual({
      id: 'liveAccount',
      object: 'account',
    })
  })

  it('never reconciles an account to a live account that merely resembles it', () => {
    const current = makeSnapshot({
      account: {
        live: makeAccount({ id: 'live', title: 'Cash', balance: 100 }),
      },
    })
    const desired = makeSnapshot({
      account: {
        backup: makeAccount({ id: 'backup', title: 'Cash', balance: 100 }),
      },
    })

    const plan = buildRestorePlan(current, desired, { allocateId })
    expect(plan.mappings.account).toEqual({ backup: 'fresh:account:backup' })
    expect(plan.patch.account).toEqual([
      expect.objectContaining({ id: 'fresh:account:backup', title: 'Cash' }),
    ])
    expect(plan.patch.deletion).toEqual([{ id: 'live', object: 'account' }])

    const restored = applyDiff(current, desired)
    expect(restored.account.live).toBeUndefined()
    expect(restored.account['restored:account:backup']).toMatchObject({
      title: 'Cash',
    })
  })

  it('replaces a transaction when immutable created differs and then converges', () => {
    const current = makeSnapshot({
      transaction: {
        old: makeTransaction({ id: 'old', created: 1, outcome: 10 }),
      },
    })
    const desired = makeSnapshot({
      transaction: {
        old: makeTransaction({ id: 'old', created: 2, outcome: 10 }),
      },
    })

    const patch = buildRestorePlan(current, desired, { allocateId }).patch
    expect(patch.transaction).toEqual([
      expect.objectContaining({ id: 'fresh:transaction:old', created: 2 }),
      { id: 'old', deleted: true },
    ])

    const command = issuePatch(current, patch, 1700000000000)
    const restored = applyPatch(current, materializeCommand(current, command))
    expect(buildRestorePlan(restored, desired, { allocateId }).patch).toEqual(
      {}
    )
  })

  it('preserves explicit null, false, and zero factory fields through restore replay', () => {
    const desired = makeSnapshot({
      account: {
        account: makeAccount({
          id: 'account',
          title: 'Exact account',
          role: 0,
          savings: null,
          capitalization: false,
          percent: 0,
          endDateOffset: 0,
          payoffStep: 0,
        }),
      },
      tag: {
        tag: makeTag({
          id: 'tag',
          title: 'Exact tag',
          archive: null,
          required: null,
          color: 0,
        }),
      },
      budget: {
        '2026-01-01#null': makeBudget({
          id: '2026-01-01#null',
          tag: null,
          date: '2026-01-01',
          incomeLock: false,
          outcomeLock: false,
        }),
      },
      reminder: {
        reminder: makeReminder({
          id: 'reminder',
          incomeAccount: 'account',
          outcomeAccount: 'account',
          incomeInstrument: 0,
          outcomeInstrument: 0,
          tag: ['tag'],
          step: null,
          points: null,
        }),
      },
      reminderMarker: {
        marker: makeReminderMarker({
          id: 'marker',
          incomeAccount: 'account',
          outcomeAccount: 'account',
          incomeInstrument: 0,
          outcomeInstrument: 0,
          tag: ['tag'],
          reminder: 'reminder',
        }),
      },
    })

    // The account keeps the backup's own id — the ordinary same-account case
    // the identity rule leaves unchanged — so its convergence on replay does
    // not depend on the account matching rule under test elsewhere.
    const current = makeSnapshot({
      account: {
        account: makeAccount({ id: 'account', title: 'Placeholder' }),
      },
    })
    const restored = applyDiff(current, desired)

    expect(buildRestorePlan(restored, desired, { allocateId }).patch).toEqual(
      {}
    )
  })

  it('treats duplicate semantic rows as a multiset', () => {
    const current = makeSnapshot({
      transaction: {
        first: makeTransaction({ id: 'first', created: 1, outcome: 10 }),
        second: makeTransaction({ id: 'second', created: 1, outcome: 10 }),
      },
    })
    const desired = makeSnapshot({
      transaction: {
        backup: makeTransaction({ id: 'backup', created: 1, outcome: 10 }),
      },
    })

    const plan = buildRestorePlan(current, desired, { allocateId })
    expect(plan.mappings.transaction).toEqual({ backup: 'first' })
    expect(plan.patch.transaction).toEqual([{ id: 'second', deleted: true }])
  })
})

describe('diffStores scope', () => {
  const current = makeSnapshot({
    account: { acc: makeAccount({ id: 'acc', title: 'Cash' }) },
    transaction: {
      old: makeTransaction({ id: 'old', date: '2025-12-31', outcome: 1 }),
      new: makeTransaction({ id: 'new', date: '2026-01-15', outcome: 2 }),
    },
  })
  const desired = makeSnapshot({
    account: { acc: makeAccount({ id: 'acc', title: 'Wallet' }) },
    transaction: {
      old: makeTransaction({ id: 'old', date: '2025-12-31', outcome: 11 }),
      new: makeTransaction({ id: 'new', date: '2026-01-15', outcome: 22 }),
    },
  })

  it('limits the diff to the selected entity types', () => {
    expect(diffStores(current, desired, { entities: ['account'] })).toEqual({
      account: [{ id: 'acc', title: 'Wallet' }],
    })
  })

  it('limits the diff to the rows a predicate accepts', () => {
    const patch = diffStores(current, desired, {
      includes: (key, row) =>
        key !== 'transaction' || String(row.date).startsWith('2026-01'),
    })
    expect(patch).toEqual({
      account: [{ id: 'acc', title: 'Wallet' }],
      transaction: [{ id: 'new', outcome: 22 }],
    })
  })

  it('includes a row that leaves the scope between the two stores', () => {
    const moved = makeSnapshot({
      transaction: {
        new: makeTransaction({ id: 'new', date: '2025-11-01', outcome: 2 }),
      },
    })
    const patch = diffStores(current, moved, {
      entities: ['transaction'],
      includes: (_key, row) => String(row.date).startsWith('2026-01'),
    })
    // `new` is in scope in `current` and out of it in `moved`; `old` is in
    // neither, so it keeps its own value instead of being deleted.
    expect(patch).toEqual({ transaction: [{ id: 'new', date: '2025-11-01' }] })
  })
})

describe('diffStores round trip', () => {
  it('reproduces a backup as the state it described', () => {
    const backup = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', title: 'Cash' }) },
      merchant: { shop: makeMerchant({ id: 'shop', title: 'Shop' }) },
      tag: { food: makeTag({ id: 'food', title: 'Food' }) },
      transaction: {
        tr: makeTransaction({
          id: 'tr',
          incomeAccount: 'acc',
          outcomeAccount: 'acc',
          outcome: 100,
          tag: ['food'],
          merchant: 'shop',
        }),
      },
    })

    // The live store drifted: an edit, a rename, and a later transaction.
    const drifted = applyDiff(
      backup,
      makeSnapshot({
        account: { acc: makeAccount({ id: 'acc', title: 'Wallet' }) },
        merchant: { shop: makeMerchant({ id: 'shop', title: 'Shop' }) },
        tag: { food: makeTag({ id: 'food', title: 'Food' }) },
        transaction: {
          tr: makeTransaction({
            id: 'tr',
            incomeAccount: 'acc',
            outcomeAccount: 'acc',
            outcome: 250,
            tag: ['food'],
            merchant: 'shop',
          }),
          later: makeTransaction({
            id: 'later',
            incomeAccount: 'acc',
            outcomeAccount: 'acc',
            outcome: 7,
          }),
        },
      })
    )

    const restored = applyDiff(drifted, backup)
    expect(restored.account.acc.title).toBe('Cash')
    expect(restored.transaction.tr.outcome).toBe(100)
    expect(restored.transaction['restored:transaction:later'].deleted).toBe(
      true
    )
    // Restoring twice is a no-op: the second diff has nothing left to write.
    expect(diffStores(restored, backup)).toEqual({})
  })
})

describe('summarizeStoreDiff', () => {
  it('counts creations, updates, and removals against the current store', () => {
    const current = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', title: 'Cash' }) },
      reminder: { rem: makeReminder({ id: 'rem' }) },
      transaction: { tr: makeTransaction({ id: 'tr' }) },
    })
    const desired = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc', title: 'Wallet' }) },
      tag: { food: makeTag({ id: 'food', title: 'Food' }) },
    })

    expect(summarizeStoreDiff(current, diffStores(current, desired))).toEqual({
      account: { created: 0, updated: 1, removed: 0 },
      tag: { created: 1, updated: 0, removed: 0 },
      reminder: { created: 0, updated: 0, removed: 1 },
      transaction: { created: 0, updated: 0, removed: 1 },
    })
  })

  it('counts entries inside a hidden-data payload, not the reminder holding them', () => {
    const budgets = (payload: object) =>
      makeReminder({
        id: 'budgets',
        comment: JSON.stringify({
          type: HiddenDataType.Budgets,
          month: '2026-08',
          payload,
        }),
      })
    const current = makeSnapshot({
      reminder: {
        budgets: budgets({
          'tag#food': 5000,
          'tag#car': 3000,
          'tag#gone': 1000,
        }),
      },
    })
    const desired = makeSnapshot({
      reminder: {
        budgets: budgets({
          'tag#food': 5000, // unchanged
          'tag#car': 4000, // changed
          'tag#new': 200, // added
        }),
      },
    })

    // Both payloads are in hand here, so the count is envelopes rather than
    // the one monthly record a list row can see.
    expect(summarizeStoreDiff(current, diffStores(current, desired))).toEqual({
      'envelope-budget': { created: 1, updated: 1, removed: 1 },
    })
  })

  it('counts what a deleted hidden-data reminder takes with it', () => {
    const current = makeSnapshot({
      reminder: {
        goals: makeReminder({
          id: 'goals',
          comment: JSON.stringify({
            type: HiddenDataType.Goals,
            month: '2026-08',
            payload: { 'tag#car': { amount: 1 }, 'tag#trip': { amount: 2 } },
          }),
        }),
      },
    })
    const desired = makeSnapshot({})

    expect(summarizeStoreDiff(current, diffStores(current, desired))).toEqual({
      goal: { created: 0, updated: 0, removed: 2 },
    })
  })

  it('leaves out the account Zerro stores its own state under', () => {
    const goals = makeReminder({
      id: 'goals',
      comment: JSON.stringify({
        type: HiddenDataType.Goals,
        month: '2026-08',
        payload: { 'tag#car': { amount: 1 } },
      }),
    })
    const current = makeSnapshot({
      account: {
        data: makeAccount({ id: 'data', title: ZERRO_DATA_ACCOUNT_NAME }),
      },
      reminder: { goals },
    })
    const patch = diffStores(current, makeSnapshot())

    // The plan still removes it — restoring past its creation really does —
    // but "Accounts remove 1" would bill Zerro's own storage for a goal the
    // user set, so only the goal is counted.
    expect(patch.deletion).toContainEqual({ id: 'data', object: 'account' })
    expect(summarizeStoreDiff(current, patch)).toEqual({
      goal: { created: 0, updated: 0, removed: 1 },
    })
  })

  it('leaves it out when a restore would recreate it', () => {
    const current = makeSnapshot()
    const desired = makeSnapshot({
      account: {
        data: makeAccount({ id: 'data', title: ZERRO_DATA_ACCOUNT_NAME }),
      },
      reminder: {
        goals: makeReminder({
          id: 'goals',
          incomeAccount: 'data',
          outcomeAccount: 'data',
          comment: JSON.stringify({
            type: HiddenDataType.Goals,
            month: '2026-08',
            payload: { 'tag#car': { amount: 1 } },
          }),
        }),
      },
    })

    // A creation intent carries the title, so the anchor is recognizable from
    // the intent alone, with nothing in the current store to compare against.
    expect(summarizeStoreDiff(current, diffStores(current, desired))).toEqual({
      goal: { created: 1, updated: 0, removed: 0 },
    })
  })

  it('keeps an unreadable payload as a plain reminder', () => {
    const current = makeSnapshot({
      reminder: { rem: makeReminder({ id: 'rem', comment: 'Pay the rent' }) },
    })
    const desired = makeSnapshot({
      reminder: {
        rem: makeReminder({ id: 'rem', comment: '{"type":"budgets","pay' }),
      },
    })

    expect(summarizeStoreDiff(current, diffStores(current, desired))).toEqual({
      reminder: { created: 0, updated: 1, removed: 0 },
    })
  })
})
