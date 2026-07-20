import { describe, expect, it } from 'vitest'

import {
  buildCurrentFxRates,
  buildFxConverter,
  buildFxRates,
  buildFxRatesGetter,
} from './read'

describe('fx rates', () => {
  it('merges stored rates with current instrument rates and converts by date', () => {
    const currentRates = buildCurrentFxRates({
      currentMonth: '2026-03',
      instruments: {
        1: {
          id: 1,
          changed: 20,
          shortTitle: 'USD',
          symbol: '$',
          title: 'US Dollar',
          rate: 1,
        },
        2: {
          id: 2,
          changed: 30,
          shortTitle: 'EUR',
          symbol: 'EUR',
          title: 'Euro',
          rate: 2,
        },
      },
    })
    const rates = buildFxRates({
      currentRates,
      storedRates: {
        '2026-01': {
          date: '2026-01',
          changed: 10,
          rates: { EUR: 4 },
        },
      },
    })
    const getter = buildFxRatesGetter({ rates, currentRates })
    const convert = buildFxConverter(getter)

    expect(rates['2026-01']).toEqual({
      date: '2026-01',
      type: 'saved',
      changed: 10,
      rates: { USD: 1, EUR: 4 },
    })
    expect(rates['2026-03']).toEqual(currentRates)
    expect(convert({ EUR: 8 }, 'USD', '2026-01')).toBe(32)
    expect(convert({ EUR: 8 }, 'USD', '2026-02')).toBe(32)
    expect(convert({ EUR: 8 }, 'USD', 'current')).toBe(16)
  })
})
