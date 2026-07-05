import { describe, expect, it } from 'vitest'
import type { TTransaction } from '6-shared/types'
import { getTransactionType, TrType } from './transactions'

describe('transaction helpers', () => {
  it('detects debt transactions before regular transfers', () => {
    expect(
      getTransactionType(transaction({ incomeAccount: 'debt', outcome: 10 }), 'debt')
    ).toBe(TrType.OutcomeDebt)
    expect(
      getTransactionType(transaction({ outcomeAccount: 'debt', income: 10 }), 'debt')
    ).toBe(TrType.IncomeDebt)
  })

  it('detects income, outcome, and transfer transactions', () => {
    expect(getTransactionType(transaction({ income: 10, outcome: 0 }))).toBe(
      TrType.Income
    )
    expect(getTransactionType(transaction({ income: 0, outcome: 10 }))).toBe(
      TrType.Outcome
    )
    expect(getTransactionType(transaction({ income: 10, outcome: 10 }))).toBe(
      TrType.Transfer
    )
  })
})

function transaction(patch: Partial<TTransaction>): TTransaction {
  return {
    id: 'tr',
    changed: 1,
    created: 1,
    user: 1,
    deleted: false,
    hold: null,
    date: '2026-01-01',
    income: 0,
    incomeAccount: 'income',
    incomeInstrument: 1,
    outcome: 0,
    outcomeAccount: 'outcome',
    outcomeInstrument: 1,
    tag: null,
    merchant: null,
    payee: null,
    originalPayee: null,
    comment: null,
    reminderMarker: null,
    opIncome: 0,
    opIncomeInstrument: null,
    opOutcome: 0,
    opOutcomeInstrument: null,
    latitude: null,
    longitude: null,
    ...patch,
  } as TTransaction
}
