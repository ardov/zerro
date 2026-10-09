import { describe, expect, it } from 'vitest'

import type { TDataStore } from '@/6-shared/types'
import { EnvType, envId } from '../../internal/domain/zerro/envelope-id'
import {
  makeTransaction,
  makeAccount,
  makeTag,
  makeMerchant,
} from '../../support/testing/zenmoneyTestData'
import { createZerroSession } from './createZerroSession'

describe('createZerroSession', () => {
  it('searches the names from its own immutable snapshot', () => {
    const data = makeEmptyData()
    data.account.card = makeAccount({ id: 'card', title: 'Travel card' })
    data.tag.food = makeTag({ id: 'food', title: 'Groceries' })
    data.merchant.shop = makeMerchant({ id: 'shop', title: 'Lidl' })
    data.transaction.expense = makeTransaction({
      id: 'expense',
      outcome: 15,
      outcomeAccount: 'card',
      tag: ['food'],
      merchant: 'shop',
    })
    const query = {
      clauses: [{ kind: 'search' as const, value: 'lidl grocer travel 15' }],
    }
    const ctx = {
      now: () => Date.parse('2026-01-15T12:00:00Z'),
      uuid: () => 'test-id',
    }
    const session = createZerroSession(data, ctx)
    expect(session.transactions.query(query).map(item => item.id)).toEqual([
      'expense',
    ])
    const renamed = createZerroSession(
      {
        ...data,
        merchant: { shop: { ...data.merchant.shop, title: 'Other' } },
      },
      ctx
    )
    expect(renamed.transactions.query(query)).toEqual([])
    expect(session.transactions.query(query).map(item => item.id)).toEqual([
      'expense',
    ])
  })
  it('memoizes reads for the session lifetime', () => {
    let now = Date.parse('2026-01-15T12:00:00.000Z')
    const session = createZerroSession(makeEmptyData(), {
      now: () => now,
      uuid: () => 'test-id',
    })

    expect(session.calendar.getCurrentMonth()).toBe('2026-01')

    now = Date.parse('2026-02-15T12:00:00.000Z')

    expect(session.calendar.getCurrentMonth()).toBe('2026-01')
  })

  it('starts the month list at the first reasonable transaction date', () => {
    const data = makeEmptyData()
    data.transaction = {
      technical: makeTransaction({
        id: 'technical',
        date: '1970-01-01',
        outcome: 1,
      }),
      regular: makeTransaction({
        id: 'regular',
        date: '2026-01-15',
        outcome: 1,
      }),
      future: makeTransaction({
        id: 'future',
        date: '2026-12-01',
        outcome: 1,
      }),
    }
    const session = createZerroSession(data, {
      now: () => Date.parse('2026-03-15T12:00:00.000Z'),
      uuid: () => 'test-id',
    })

    expect(session.transactions.getHistoryStart()).toBe('2026-01-15')
    expect(session.months.getList()).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
    ])
  })

  it('can build headless envelopes without adapter-provided populated tags', () => {
    const nullTagId = envId.get(EnvType.Tag, null)
    const session = createZerroSession(makeEmptyData(), {
      now: () => Date.parse('2026-01-15T12:00:00.000Z'),
      uuid: () => 'test-id',
    })

    const envelopes = session.envelopes.getAll()

    expect(envelopes[nullTagId]).toMatchObject({
      id: nullTagId,
      entityId: 'null',
      name: 'No category',
      currency: 'USD',
    })
    expect(session.envelopes.getAll()).toBe(envelopes)
  })

  it('queries sorted transactions with Core filter semantics', () => {
    const data = makeEmptyData()
    data.transaction = {
      expense: makeTransaction({
        id: 'expense',
        date: '2026-01-10',
        outcome: 25,
        income: 0,
        comment: 'Market',
      }),
      income: makeTransaction({
        id: 'income',
        date: '2026-01-11',
        outcome: 0,
        income: 100,
      }),
      deleted: makeTransaction({
        id: 'deleted',
        date: '2026-01-12',
        deleted: true,
        outcome: 10,
      }),
    }
    const session = createZerroSession(data, {
      now: () => Date.parse('2026-01-15T12:00:00.000Z'),
      uuid: () => 'test-id',
    })

    expect(
      session.transactions
        .query({ clauses: [{ kind: 'search', value: 'market' }] })
        .map(transaction => transaction.id)
    ).toEqual(['expense'])
    expect(
      session.transactions
        .query({ clauses: [{ kind: 'deleted', mode: 'include' }] })
        .map(transaction => transaction.id)
    ).toEqual(['expense', 'income', 'deleted'])
  })
})

function makeEmptyData(): TDataStore {
  return {
    serverTimestamp: 0,
    instrument: {},
    country: {},
    company: {},
    user: {},
    merchant: {},
    account: {},
    tag: {},
    budget: {},
    reminder: {},
    reminderMarker: {},
    transaction: {},
  }
}
