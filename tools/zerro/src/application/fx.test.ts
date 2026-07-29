// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { buildRatesMeta, convertFx } from './fx'

describe('fx helpers', () => {
  it('restricts rates.values to used instruments plus the base currency', () => {
    const instruments = {
      1: { shortTitle: 'RUB', rate: 1 },
      2: { shortTitle: 'USD', rate: 78.698 },
      3: { shortTitle: 'EUR', rate: 89.6292 },
      4: { shortTitle: 'JPY', rate: 0.480452 },
    }
    const meta = buildRatesMeta(instruments, new Set([2]))
    expect(meta.base).toBe('RUB')
    expect(meta.values).toEqual({ RUB: 1, USD: 78.698 })
  })

  it('converts an FX vector into a target currency using base-relative rates', () => {
    const rates = { RUB: 1, USD: 78.698, CZK: 3.69752 }
    const total = convertFx({ USD: 100, CZK: 369.752 }, 'CZK', rates)
    expect(total).toBeCloseTo(100 * (78.698 / 3.69752) + 369.752, 2)
  })

  it('ignores currencies missing from the rates table instead of producing NaN', () => {
    const rates = { RUB: 1, USD: 78.698 }
    const total = convertFx({ USD: 10, XYZ: 999 }, 'USD', rates)
    expect(total).toBe(10)
  })

  it('returns 0 when the target currency has no known rate', () => {
    const rates = { RUB: 1, USD: 78.698 }
    expect(convertFx({ USD: 10 }, 'ZZZ', rates)).toBe(0)
  })
})
