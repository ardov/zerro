import { describe, expect, it } from 'vitest'
import { formatValuation } from './format'

describe('formatValuation', () => {
  it('shows two significant digits for nonzero amounts that round to zero', () => {
    expect(formatValuation(-0.000000416)).toBe('-0,00000042')
    expect(formatValuation(-0.005)).toBe('-0,005')
    expect(formatValuation(0)).toBe('0,00')
  })

  it('uses monetary rounding when the value is at least one rounded cent', () => {
    expect(formatValuation(1.005)).toBe('1,01')
    expect(formatValuation(-1.005, undefined, 'ifAny')).toBe('-1')
  })
})
