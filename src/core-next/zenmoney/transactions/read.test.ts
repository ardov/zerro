import { describe, expect, it } from 'vitest'
import { makeTransaction } from '../../testing/zenmoneyTestData'
import { getTransactionType, TrType } from './read'

describe('transaction helpers', () => {
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
    expect(getTransactionType(makeTransaction({ income: 10, outcome: 0 }))).toBe(
      TrType.Income
    )
    expect(getTransactionType(makeTransaction({ income: 0, outcome: 10 }))).toBe(
      TrType.Outcome
    )
    expect(getTransactionType(makeTransaction({ income: 10, outcome: 10 }))).toBe(
      TrType.Transfer
    )
  })
})
