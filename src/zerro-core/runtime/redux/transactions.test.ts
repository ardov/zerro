import { describe, expect, it, vi } from 'vitest'
import { makeDemoStore } from '../../support/demo'
import { makeTestRootState } from '@/store/testing'
import {
  makeAccount,
  makeInstrument,
  makeStore,
  makeTransaction,
  makeMerchant,
  makeTag,
} from '../../support/testing/zenmoneyTestData'
import { compileQuery, selectQueryContext } from './transactions'
import { selectMonthEnd } from './balances'
import {
  selectInstCodeMap,
  selectInstrumentsByCode,
  selectTransactionIds,
  selectTransactionsHistory,
} from '../../support/testing/reduxSelectors'

const NOW = Date.parse('2026-05-15T12:00:00Z')

const makeRootState = makeTestRootState

describe('Core transaction adapter reads', () => {
  it('reads May closing balance and opens June after midnight with the same state', () => {
    const state = makeRootState(
      makeStore({
        instrument: { 1: makeInstrument({ id: 1, shortTitle: 'USD' }) },
        account: { cash: makeAccount({ id: 'cash', balance: 100 }) },
        transaction: {
          may: makeTransaction({
            id: 'may',
            date: '2026-05-31',
            outcome: 10,
            outcomeAccount: 'cash',
          }),
          june: makeTransaction({
            id: 'june',
            date: '2026-06-01',
            outcome: 20,
            outcomeAccount: 'cash',
          }),
        },
      })
    )
    const clock = vi.spyOn(Date, 'now')
    try {
      clock.mockReturnValue(new Date(2026, 4, 31, 23, 59).getTime())
      expect(selectMonthEnd(state, '2026-06')).toBeUndefined()
      clock.mockReturnValue(new Date(2026, 5, 1, 0, 1).getTime())
      expect(selectMonthEnd(state, '2026-05')?.accounts.cash).toEqual({
        USD: 120,
      })
      expect(selectMonthEnd(state, '2026-06')?.accounts.cash).toEqual({
        USD: 100,
      })
    } finally {
      clock.mockRestore()
    }
  })

  it.each(['account', 'tag', 'merchant'] as const)(
    'refreshes search after a %s rename',
    kind => {
      const data = makeDemoStore({ now: NOW })
      data.account = {
        ...data.account,
        'HSBC USD': { ...data.account['HSBC USD'], title: 'Accountneedle' },
      }
      data.tag = {
        ...data.tag,
        food: makeTag({ id: 'food', title: 'Tagneedle' }),
      }
      data.merchant = {
        ...data.merchant,
        shop: makeMerchant({ id: 'shop', title: 'Merchantneedle' }),
      }
      const transaction = makeTransaction({
        outcome: 12,
        outcomeAccount: 'HSBC USD',
        tag: ['food'],
        merchant: 'shop',
      })
      const first = selectQueryContext(makeRootState(data))
      const value = `${kind}needle`
      const query = { clauses: [{ kind: 'search' as const, value }] }
      expect(compileQuery(query, first)(transaction)).toBe(true)
      const changed = {
        ...data,
        account:
          kind === 'account'
            ? {
                ...data.account,
                'HSBC USD': { ...data.account['HSBC USD'], title: 'Renamed' },
              }
            : data.account,
        tag:
          kind === 'tag'
            ? { ...data.tag, food: { ...data.tag.food, title: 'Renamed' } }
            : data.tag,
        merchant:
          kind === 'merchant'
            ? {
                ...data.merchant,
                shop: { ...data.merchant.shop, title: 'Renamed' },
              }
            : data.merchant,
      }
      const next = selectQueryContext(makeRootState(changed))
      expect(next).not.toBe(first)
      expect(compileQuery(query, next)(transaction)).toBe(false)
      expect(
        compileQuery(
          { clauses: [{ kind: 'search', value: 'Renamed' }] },
          next
        )(transaction)
      ).toBe(true)
    }
  )
  it('indexes instruments by code and reports the code of each instrument id', () => {
    const eur = makeInstrument({ id: 3, shortTitle: 'EUR' })
    const usd = makeInstrument({ id: 7, shortTitle: 'USD' })
    const state = makeRootState(makeStore({ instrument: { 3: eur, 7: usd } }))

    expect(selectInstrumentsByCode(state)).toEqual({ EUR: eur, USD: usd })
    expect(selectInstCodeMap(state)).toEqual({ 3: 'EUR', 7: 'USD' })
  })

  it('reads transaction ids in list order and omits deleted or empty rows from history', () => {
    const data = makeStore({
      transaction: {
        laterCreated: makeTransaction({
          id: 'laterCreated',
          date: '2026-01-02',
          created: 2,
          outcome: 1,
        }),
        deleted: makeTransaction({
          id: 'deleted',
          date: '2026-01-04',
          deleted: true,
          outcome: 1,
        }),
        earlierCreated: makeTransaction({
          id: 'earlierCreated',
          date: '2026-01-02',
          created: 1,
          outcome: 1,
        }),
        empty: makeTransaction({ id: 'empty', date: '2026-01-03' }),
        oldest: makeTransaction({
          id: 'oldest',
          date: '2026-01-01',
          outcome: 1,
        }),
      },
    })
    const state = makeRootState(data)

    expect(selectTransactionIds(state)).toEqual([
      'oldest',
      'earlierCreated',
      'laterCreated',
      'empty',
      'deleted',
    ])
    expect(selectTransactionsHistory(state).map(item => item.id)).toEqual([
      'oldest',
      'earlierCreated',
      'laterCreated',
    ])

    const updated = makeRootState({
      ...data,
      transaction: {
        ...data.transaction,
        laterCreated: { ...data.transaction.laterCreated, deleted: true },
      },
    })
    expect(selectTransactionsHistory(updated).map(item => item.id)).toEqual([
      'oldest',
      'earlierCreated',
    ])
  })
})

it('refreshes currency matching when instrument metadata changes', () => {
  const data = makeDemoStore({ now: NOW })
  const transaction = makeTransaction({
    income: 0,
    outcome: 10,
    outcomeInstrument: 1,
    outcomeAccount: 'HSBC USD',
  })
  const query = { clauses: [{ kind: 'amount' as const, currencies: ['USD'] }] }
  const first = selectQueryContext(makeRootState(data))
  expect(compileQuery(query, first)(transaction)).toBe(true)
  const next = selectQueryContext(
    makeRootState({
      ...data,
      instrument: {
        ...data.instrument,
        1: { ...data.instrument[1], shortTitle: 'EUR' },
      },
    })
  )
  expect(next).not.toBe(first)
  expect(compileQuery(query, next)(transaction)).toBe(false)
})
