import { describe, expect, it } from 'vitest'
import { GroupBy } from '@/6-shared/helpers/date'
import { makeTransaction } from '@/zerro-core/support/testing/zenmoneyTestData'
import { calcCashflow } from './calcCashflow'

describe('shared cashflow aggregation', () => {
  it('shares one aggregation between widgets using the same snapshot', () => {
    const transactions = [
      makeTransaction({
        id: 'expense',
        date: '2026-01-12',
        income: 0,
        outcome: 10,
        outcomeInstrument: 1,
        outcomeAccount: 'cash',
      }),
    ]
    const codes = { 1: 'USD' }
    const accounts = { cash: { inBudget: true } }
    const first = calcCashflow(transactions, undefined, codes, accounts)
    expect(first['2026-01-01'].outcomeInBalance).toEqual({ USD: -10 })
    expect(calcCashflow(transactions, undefined, codes, accounts)).toBe(first)
  })

  it('refreshes for changed transactions, accounts, currencies, and grouping', () => {
    const transaction = makeTransaction({
      id: 'expense',
      date: '2026-01-12',
      income: 0,
      outcome: 10,
      outcomeInstrument: 1,
      outcomeAccount: 'cash',
    })
    const transactions = [transaction]
    const codes = { 1: 'USD' }
    const accounts = { cash: { inBudget: true } }
    calcCashflow(transactions, undefined, codes, accounts)
    expect(
      calcCashflow(
        [{ ...transaction, outcome: 20 }],
        undefined,
        codes,
        accounts
      )['2026-01-01'].outcomeInBalance
    ).toEqual({ USD: -20 })
    expect(
      calcCashflow(transactions, undefined, codes, {
        cash: { inBudget: false },
      })['2026-01-01'].outcomeOutOfBalance
    ).toEqual({ USD: -10 })
    expect(
      calcCashflow(transactions, undefined, { 1: 'EUR' }, accounts)[
        '2026-01-01'
      ].outcomeInBalance
    ).toEqual({ EUR: -10 })
    expect(
      Object.keys(
        calcCashflow(transactions, undefined, codes, accounts, GroupBy.Day)
      )
    ).toEqual(['2026-01-12'])
  })
})
