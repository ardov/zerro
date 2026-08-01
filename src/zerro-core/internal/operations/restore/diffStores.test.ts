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
import { applyPatch } from '../../domain/zenmoney/model/applyPatch'
import type { TDataStore } from '../../domain/zenmoney/model/store'
import { issuePatch, materializeCommand } from '../materialization'
import { diffStores, summarizeStoreDiff } from './diffStores'

const rootUser = makeUser({ id: 1, parent: null, currency: 2 })

function makeSnapshot(patch: Partial<TDataStore> = {}): TDataStore {
  return makeStore({ user: { 1: rootUser }, ...patch })
}

/** Applies a diff the way a real caller does: as an ordinary command. */
function applyDiff(current: TDataStore, desired: TDataStore): TDataStore {
  const patch = diffStores(current, desired)
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
          id: 'created',
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

  it('recreates a missing row under its own id', () => {
    const current = makeSnapshot()
    const desired = makeSnapshot({
      tag: { food: makeTag({ id: 'food', title: 'Food', color: 5 }) },
    })

    const patch = diffStores(current, desired)
    expect(patch.tag).toEqual([
      expect.objectContaining({ id: 'food', title: 'Food', color: 5 }),
    ])

    const next = applyDiff(current, desired)
    expect(next.tag.food).toMatchObject({ id: 'food', title: 'Food', color: 5 })
    expect(next.tag.food.user).toBe(rootUser.id)
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
      'a',
      'b',
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

  it('leaves accounts, tags, and merchants in place', () => {
    const current = makeSnapshot({
      account: { acc: makeAccount({ id: 'acc' }) },
      tag: { food: makeTag({ id: 'food' }) },
      merchant: { shop: makeMerchant({ id: 'shop' }) },
    })
    expect(diffStores(current, makeSnapshot())).toEqual({})
  })
})

describe('diffStores and the deletion ratchet', () => {
  it('never resurrects a deleted transaction', () => {
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
    expect(diffStores(current, desired)).toEqual({})
  })

  it('does not recreate a transaction that was deleted in the backup', () => {
    const current = makeSnapshot()
    const desired = makeSnapshot({
      transaction: { tr: makeTransaction({ id: 'tr', deleted: true }) },
    })
    expect(diffStores(current, desired)).toEqual({})
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
    expect(restored.transaction.later.deleted).toBe(true)
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
})
