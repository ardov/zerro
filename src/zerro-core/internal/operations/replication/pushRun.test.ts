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
import { globalBudgetTagId } from '../../domain/zenmoney'
import { issuePatch, type TCommand } from '../materialization'
import { beginPush, acceptPushChunk, shrinkPushChunk } from './pushRun'

const now = Date.parse('2026-08-31T12:00:00.000Z')

describe('bounded outbox push', () => {
  it('keeps a small combined upsert and cleanup in one request', () => {
    const base = makeBase()
    const command = issuePatch(
      base,
      {
        account: [makeAccount({ id: 'cash', title: 'Wallet' })],
        deletion: [
          { id: 'old-merchant', object: 'merchant', stamp: now, user: 1 },
        ],
      },
      now
    )

    const prepared = beginPush({ base, outbox: [command] }, now)

    expect(prepared?.run.multiChunk).toBe(false)
    expect(prepared?.request.account?.[0]).toMatchObject({
      id: 'cash',
      title: 'Wallet',
    })
    expect(prepared?.request.deletion).toEqual([
      expect.objectContaining({ id: 'old-merchant', object: 'merchant' }),
    ])
  })

  it('orders dependency upserts before a separate reverse-dependency cleanup', () => {
    const base = makeBase()
    const account = makeAccount({ id: 'new-account', title: 'New account' })
    const parent = makeTag({ id: 'parent', title: 'Parent', parent: null })
    const child = makeTag({ id: 'child', title: 'Child', parent: 'parent' })
    const transaction = makeTransaction({
      id: 'new-transaction',
      incomeAccount: account.id,
      outcomeAccount: account.id,
    })
    const command = issuePatch(
      base,
      {
        transaction: [transaction],
        tag: [child, parent],
        account: [account],
        deletion: [
          { id: 'cash', object: 'account', stamp: now, user: 1 },
          {
            id: 'old-transaction',
            object: 'transaction',
            stamp: now,
            user: 1,
          },
        ],
      },
      now
    )

    let prepared = beginPush({ base, outbox: [command] }, now, { maxBytes: 1 })
    expect(prepared?.run.multiChunk).toBe(true)
    expect(prepared?.request.account?.[0]?.id).toBe('new-account')

    const seen: string[] = []
    let replica = {
      base,
      outbox: [command] as TCommand[],
      redo: [] as TCommand[],
    }
    while (prepared) {
      const request = prepared.request
      const key = Object.keys(request).find(name => name !== 'serverTimestamp')
      if (key) {
        const value = (request as Record<string, any>)[key][0]
        seen.push(
          key === 'deletion' ? `delete:${value.object}` : `${key}:${value.id}`
        )
      }
      const accepted = acceptPushChunk(replica, prepared, request)
      replica = accepted
      prepared = accepted.next
    }

    expect(seen).toEqual([
      'account:new-account',
      'tag:parent',
      'tag:child',
      'transaction:new-transaction',
      'delete:account',
      'delete:transaction',
    ])
  })

  it('isolates account and tag deletions and deletes child tags first', () => {
    const parent = makeTag({ id: 'parent', title: 'Parent', parent: null })
    const child = makeTag({ id: 'child', title: 'Child', parent: parent.id })
    const tags = [parent, child]
    const accounts = Array.from({ length: 2 }, (_, index) =>
      makeAccount({ id: `account-${index}`, title: `Account ${index}` })
    )
    const base = makeStore({
      ...makeBase(),
      tag: Object.fromEntries(tags.map(tag => [tag.id, tag])),
      account: Object.fromEntries(
        accounts.map(account => [account.id, account])
      ),
    })
    const command = issuePatch(
      base,
      {
        deletion: [
          ...tags.map(tag => ({ id: tag.id, object: 'tag' as const })),
          ...accounts.map(account => ({
            id: account.id,
            object: 'account' as const,
          })),
        ],
      },
      now
    )

    let prepared = beginPush({ base, outbox: [command] }, now, {
      maxBytes: 1_000_000,
    })
    if (!prepared) throw new Error('Expected a prepared push')
    expect(prepared.run.multiChunk).toBe(true)

    let replica = { base, outbox: [command] as TCommand[] }
    const seen: string[] = []
    while (prepared) {
      const item = prepared.request.deletion?.[0]
      expect(prepared.request.deletion).toHaveLength(1)
      if (!item) throw new Error('Expected one deletion')
      seen.push(`${item.object}:${item.id}`)
      const accepted = acceptPushChunk(replica, prepared, prepared.request)
      replica = accepted
      prepared = accepted.next
    }

    expect(seen).toEqual([
      'account:account-0',
      'account:account-1',
      'tag:child',
      'tag:parent',
    ])
  })

  it('sends accounts first and drops removals confirmed by their cascade', () => {
    const account = makeAccount({ id: 'gone', title: 'Gone' })
    const reminder = makeReminder({
      id: 'reminder',
      incomeAccount: account.id,
      outcomeAccount: account.id,
    })
    const marker = makeReminderMarker({
      id: 'marker',
      reminder: reminder.id,
      incomeAccount: account.id,
      outcomeAccount: account.id,
    })
    const transaction = makeTransaction({
      id: 'transaction',
      incomeAccount: account.id,
      outcomeAccount: account.id,
    })
    const base = makeStore({
      ...makeBase(),
      account: { [account.id]: account },
      reminder: { [reminder.id]: reminder },
      reminderMarker: { [marker.id]: marker },
      transaction: { [transaction.id]: transaction },
    })
    const command = issuePatch(
      base,
      {
        deletion: [
          { id: marker.id, object: 'reminderMarker' },
          { id: reminder.id, object: 'reminder' },
          { id: account.id, object: 'account' },
        ],
        transaction: [{ id: transaction.id, deleted: true }],
      },
      now
    )

    const prepared = beginPush({ base, outbox: [command] }, now, {
      maxBytes: 1_000_000,
    })
    if (!prepared) throw new Error('Expected a prepared push')
    expect(prepared.run.multiChunk).toBe(true)
    expect(prepared.request.transaction).toBeUndefined()
    expect(prepared.request.deletion).toEqual([
      expect.objectContaining({ id: account.id, object: 'account' }),
    ])

    const accepted = acceptPushChunk({ base, outbox: [command] }, prepared, {
      serverTimestamp: now,
      deletion: [
        { id: account.id, object: 'account', stamp: now, user: 1 },
        { id: reminder.id, object: 'reminder', stamp: now, user: 1 },
        { id: marker.id, object: 'reminderMarker', stamp: now, user: 1 },
        {
          id: transaction.id,
          object: 'transaction',
          stamp: now,
          user: 1,
        },
      ],
    })

    expect(accepted.outbox).toEqual([])
    expect(accepted.next).toBeUndefined()
  })

  it('collapses only the accepted prefix and preserves commands appended later', () => {
    const base = makeBase()
    const first = issuePatch(
      base,
      {
        merchant: [makeMerchant({ id: 'one', title: 'One' })],
        tag: [makeTag({ id: 'two', title: 'Two' })],
      },
      now
    )
    const prepared = beginPush({ base, outbox: [first] }, now, { maxBytes: 1 })
    if (!prepared) throw new Error('Expected a prepared push')
    const later = issuePatch(
      base,
      {
        account: [makeAccount({ id: 'cash', title: 'Later' })],
      },
      now + 1
    )

    const accepted = acceptPushChunk(
      { base, outbox: [first, later], redo: [later] },
      prepared,
      prepared.request
    )

    expect(accepted.outbox).toHaveLength(2)
    expect(accepted.outbox[0].patch.merchant).toBeUndefined()
    expect(accepted.outbox[0].patch.tag).toHaveLength(1)
    expect(accepted.outbox[1]).toEqual(later)
    expect(accepted.redo).toEqual([])
    expect(accepted.progress).toEqual(
      expect.arrayContaining([
        { key: 'merchant', confirmed: 1, total: 1 },
        { key: 'tag', confirmed: 0, total: 1 },
      ])
    )
  })

  it('repackages the same unconfirmed batch after 413', () => {
    const base = makeBase()
    const command = issuePatch(
      base,
      {
        merchant: [
          makeMerchant({ id: 'one', title: 'One' }),
          makeMerchant({ id: 'two', title: 'Two' }),
        ],
      },
      now
    )
    const prepared = beginPush({ base, outbox: [command] }, now, {
      maxBytes: 10_000,
    })
    if (!prepared) throw new Error('Expected a prepared push')
    expect(prepared.requestItemCount).toBe(2)

    let shrunk = prepared
    while (shrunk.requestItemCount > 1) {
      const next = shrinkPushChunk({ base }, shrunk)
      if (!next) throw new Error('Expected the chunk to remain splittable')
      shrunk = next
    }

    expect(shrunk.request.merchant).toHaveLength(1)
    expect(shrinkPushChunk({ base }, shrunk)).toBeUndefined()
    expect(command.patch.merchant).toHaveLength(2)
  })

  it('cleans canonical orphan relations before preparing an existing outbox', () => {
    const base = makeBase()
    const command = issuePatch(
      base,
      {
        budget: [
          makeBudget({
            id: '2026-01-01#missing-tag',
            tag: 'missing-tag',
          }),
          makeBudget({
            id: `2026-01-01#${globalBudgetTagId}`,
            tag: globalBudgetTagId,
          }),
        ],
        reminderMarker: [
          makeReminderMarker({
            id: 'orphan-marker',
            reminder: 'missing-reminder',
            incomeAccount: 'cash',
            outcomeAccount: 'cash',
          }),
        ],
        transaction: [
          makeTransaction({
            id: 'linked-transaction',
            incomeAccount: 'cash',
            outcomeAccount: 'cash',
            reminderMarker: 'orphan-marker',
          }),
        ],
      },
      now
    )

    const prepared = beginPush({ base, outbox: [command] }, now)

    expect(prepared?.request.reminderMarker).toBeUndefined()
    expect(prepared?.request.budget).toEqual([
      expect.objectContaining({ tag: globalBudgetTagId }),
    ])
    expect(prepared?.request.transaction).toEqual([
      expect.objectContaining({ reminderMarker: null }),
    ])
  })

  it('acknowledges an outbox that becomes empty after relation cleanup', () => {
    const base = makeBase()
    const command = issuePatch(
      base,
      {
        reminderMarker: [
          makeReminderMarker({
            id: 'orphan-marker',
            reminder: 'missing-reminder',
            incomeAccount: 'cash',
            outcomeAccount: 'cash',
          }),
        ],
      },
      now
    )

    const prepared = beginPush({ base, outbox: [command] }, now)
    if (!prepared) throw new Error('Expected a cursor-only push')

    expect(prepared.requestItemCount).toBe(0)
    expect(prepared.request).toEqual({ serverTimestamp: expect.any(Number) })

    const accepted = acceptPushChunk(
      { base, outbox: [command] },
      prepared,
      prepared.request
    )
    expect(accepted.outbox).toEqual([])
  })
})

function makeBase() {
  return makeStore({
    serverTimestamp: now - 10_000,
    user: { 1: makeUser({ id: 1, parent: null, currency: 1 }) },
    account: { cash: makeAccount({ id: 'cash', title: 'Cash' }) },
    merchant: {
      'old-merchant': makeMerchant({ id: 'old-merchant', title: 'Old' }),
    },
    transaction: {
      'old-transaction': makeTransaction({
        id: 'old-transaction',
        incomeAccount: 'cash',
        outcomeAccount: 'cash',
      }),
    },
  })
}
