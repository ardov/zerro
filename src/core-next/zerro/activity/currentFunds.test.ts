import { describe, expect, it } from 'vitest'
import { buildCurrentFunds } from './currentFunds'

describe('buildCurrentFunds', () => {
  it('sums balances by currency', () => {
    expect(
      buildCurrentFunds([
        { fxCode: 'USD', balance: 10 },
        { fxCode: 'USD', balance: 5 },
        { fxCode: 'EUR', balance: 7 },
      ])
    ).toEqual({ USD: 15, EUR: 7 })
  })
})
