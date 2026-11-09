import { describe, expect, it } from 'vitest'
import {
  makeInstrument,
  makeTransaction,
} from '../../../../../support/testing/zenmoneyTestData'
import { getTransactionCombination } from './combination'

describe('transaction combination', () => {
  const instruments = {
    1: makeInstrument({ id: 1, rate: 0.00004 }),
    2: makeInstrument({ id: 2, rate: 0.00002 }),
  }
  const expense = makeTransaction({ outcomeAccount: 'wallet', outcome: 0.02 })

  it('only collapses exactly offsetting amounts on the same account', () => {
    const income = (amount: number) =>
      makeTransaction({ incomeAccount: 'wallet', income: amount })
    expect(
      getTransactionCombination([expense, income(0.0199)], instruments)
    ).toBe('outcome')
    expect(
      getTransactionCombination([expense, income(0.0201)], instruments)
    ).toBe('income')
    expect(
      getTransactionCombination(
        [expense, income(0.0051), income(0.0149)],
        instruments
      )
    ).toBe('collapse')
  })

  it.each([
    { income: 0.034, expected: 'transfer' },
    { income: 0.0339, expected: null },
    { income: 0.04, expected: 'transfer' },
  ])(
    'checks the 15% transfer tolerance before rounding ($income)',
    ({ income, expected }) => {
      const received = makeTransaction({
        incomeAccount: 'savings',
        incomeInstrument: 2,
        income,
      })
      expect(getTransactionCombination([expense, received], instruments)).toBe(
        expected
      )
      expect(getTransactionCombination([expense, received], {})).toBeNull()
    }
  )

  it('requires exact equality for a same-instrument transfer', () => {
    const received = makeTransaction({ incomeAccount: 'savings', income: 0.02 })
    expect(getTransactionCombination([expense, received], instruments)).toBe(
      'transfer'
    )
    expect(
      getTransactionCombination(
        [expense, { ...received, income: 0.0199 }],
        instruments
      )
    ).toBe('outcome')
  })
})
