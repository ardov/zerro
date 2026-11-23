import { describe, expect, it } from 'vitest'
import { makeTransaction } from '../../../../../support/testing/zenmoneyTestData'
import {
  getTransactionType,
  isDeletedTransaction,
  isTransactionViewed,
  TrType,
} from './read'

describe('transaction helpers', () => {
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
