import { describe, expect, it } from 'vitest'

import {
  buildCurrentFxRates,
  buildFxConverter,
  buildFxRates,
  buildFxRatesGetter,
} from './read'

describe('fx rates', () => {
  it('applies saved rates from their month on, the current month included', () => {
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
    expect(rates['2026-03']).toBeUndefined()
    expect(convert({ EUR: 8 }, 'USD', '2026-01')).toBe(32)
    expect(convert({ EUR: 8 }, 'USD', '2026-02')).toBe(32)
    expect(convert({ EUR: 8 }, 'USD', '2026-03')).toBe(32)
    expect(convert({ EUR: 8 }, 'USD', '2026-05')).toBe(32)
    expect(convert({ EUR: 8 }, 'USD', 'current')).toBe(16)
    expect(convert({ EUR: 0.0001 }, 'USD', '2026-01')).toBe(0)
    expect(convert({ EUR: 0.0001 }, 'USD', '2026-01', 'unrounded')).toBe(0.0004)
    expect(convert({ EUR: 0.0001 }, 'USD', 'current', 'unrounded')).toBe(0.0002)
  })

  it('uses current instrument rates until a saved table takes effect', () => {
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
    const convertWith = (
      storedRates: Parameters<typeof buildFxRates>[0]['storedRates']
    ) =>
      buildFxConverter(
        buildFxRatesGetter({
          rates: buildFxRates({ currentRates, storedRates }),
          currentRates,
        })
      )

    expect(buildFxRates({ currentRates, storedRates: {} })).toEqual({
      '2026-03': currentRates,
    })
    expect(convertWith({})({ EUR: 8 }, 'USD', '2026-01')).toBe(16)
    expect(convertWith({})({ EUR: 8 }, 'USD', '2026-03')).toBe(16)

    // A table saved ahead takes effect only from its own month.
    const ahead = convertWith({
      '2026-05': { date: '2026-05', changed: 10, rates: { EUR: 4 } },
    })
    expect(ahead({ EUR: 8 }, 'USD', '2026-01')).toBe(16)
    expect(ahead({ EUR: 8 }, 'USD', '2026-03')).toBe(16)
    expect(ahead({ EUR: 8 }, 'USD', '2026-04')).toBe(16)
    expect(ahead({ EUR: 8 }, 'USD', '2026-05')).toBe(32)
  })
})
