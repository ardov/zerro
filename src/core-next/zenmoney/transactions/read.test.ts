import { describe, expect, it } from 'vitest'
import { makeStore, makeTransaction } from '../../testing/zenmoneyTestData'
import {
  getTransaction,
  getTransactionIds,
  getTransactions,
  getTransactionsHistory,
  getTransactionType,
  isDeletedTransaction,
  isTransactionViewed,
  TrType,
} from './read'

describe('transaction helpers', () => {
  it('reads transactions by map and id', () => {
    const transaction = makeTransaction({ id: 'tr' })
    const data = makeStore({
      transaction: {
        tr: transaction,
      },
    })

    expect(getTransactions(data)).toBe(data.transaction)
    expect(getTransaction(data, 'tr')).toBe(transaction)
    expect(getTransaction(data, 'missing')).toBeNull()
  })

  it('builds transaction history without deleted or zeroed transactions', () => {
    const data = makeStore({
      transaction: {
        older: makeTransaction({
          id: 'older',
          date: '2026-01-01',
          created: 1,
          outcome: 1,
        }),
        newer: makeTransaction({
          id: 'newer',
          date: '2026-01-02',
          created: 1,
          outcome: 1,
        }),
        newerCreatedLater: makeTransaction({
          id: 'newerCreatedLater',
          date: '2026-01-02',
          created: 2,
          outcome: 1,
        }),
        deleted: makeTransaction({ id: 'deleted', deleted: true }),
        zeroed: makeTransaction({ id: 'zeroed', income: 0, outcome: 0 }),
      },
    })

    expect(
      getTransactionsHistory(data).map(transaction => transaction.id)
    ).toEqual(['older', 'newer', 'newerCreatedLater'])
  })

  it('keeps every transaction in list order for UI filtering', () => {
    const data = makeStore({
      transaction: {
        older: makeTransaction({ id: 'older', date: '2026-01-01', created: 1 }),
        newer: makeTransaction({ id: 'newer', date: '2026-01-02', created: 1 }),
        deleted: makeTransaction({
          id: 'deleted',
          date: '2026-01-03',
          created: 1,
          deleted: true,
        }),
      },
    })

    expect(getTransactionIds(data)).toEqual(['older', 'newer', 'deleted'])
  })

  it('treats deleted and effectively zeroed transactions as deleted', () => {
    expect(isDeletedTransaction(makeTransaction({ deleted: true }))).toBe(true)
    expect(
      isDeletedTransaction(makeTransaction({ income: 0, outcome: 0 }))
    ).toBe(true)
    expect(
      isDeletedTransaction(makeTransaction({ income: 1, outcome: 0 }))
    ).toBe(false)
  })

  it('detects debt transactions before regular transfers', () => {
    expect(
      getTransactionType(
        makeTransaction({ incomeAccount: 'debt', outcome: 10 }),
        'debt'
      )
    ).toBe(TrType.OutcomeDebt)
    expect(
      getTransactionType(
        makeTransaction({ outcomeAccount: 'debt', income: 10 }),
        'debt'
      )
    ).toBe(TrType.IncomeDebt)
  })

  it('detects income, outcome, and transfer transactions', () => {
    expect(
      getTransactionType(makeTransaction({ income: 10, outcome: 0 }))
    ).toBe(TrType.Income)
    expect(
      getTransactionType(makeTransaction({ income: 0, outcome: 10 }))
    ).toBe(TrType.Outcome)
    expect(
      getTransactionType(makeTransaction({ income: 10, outcome: 10 }))
    ).toBe(TrType.Transfer)
  })

  it('preserves viewed defaults and treats deleted transactions as viewed', () => {
    expect(isTransactionViewed(makeTransaction({ viewed: undefined }))).toBe(
      true
    )
    expect(isTransactionViewed(makeTransaction({ viewed: false }))).toBe(false)
    expect(
      isTransactionViewed(makeTransaction({ viewed: false, deleted: true }))
    ).toBe(true)
  })
})
