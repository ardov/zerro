import { describe, expect, it } from 'vitest'
import { makeAccount } from '../../../testing/zenmoneyTestData'
import { buildCurrentFunds } from './currentFunds'

describe('buildCurrentFunds', () => {
  it('sums in-budget balances by currency and ignores the rest', () => {
    const accounts = {
      usd1: makeAccount({ id: 'usd1', instrument: 1, balance: 10 }),
      usd2: makeAccount({ id: 'usd2', instrument: 1, balance: 5 }),
      eur: makeAccount({ id: 'eur', instrument: 2, balance: 7 }),
      excluded: makeAccount({ id: 'excluded', instrument: 1, balance: 999 }),
    }

    expect(
      buildCurrentFunds({
        accounts,
        inBudgetIds: ['usd1', 'usd2', 'eur'],
        instrumentCodeById: { 1: 'USD', 2: 'EUR' },
      })
    ).toEqual({ USD: 15, EUR: 7 })
  })
})
