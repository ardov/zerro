import { describe, expect, it } from 'vitest'
import { round } from './numbers'

/** The two-decimal contract every money figure in Core passes through.
 *
 * `6-shared/helpers/money/currencyHelpers.test.ts` pins the same contract for
 * the application's own copy. The two implementations must agree. */
describe('round', () => {
  it('counts money to two decimals', () => {
    expect(round(12.344)).toBe(12.34)
    expect(round(12.346)).toBe(12.35)
    expect(round(400)).toBe(400)
  })

  it('rounds a half-cent up even when the double is a hair under it', () => {
    // 1.005 is held as 1.00499999999999989, so multiplying by 100 rounds down.
    expect(round(1.005)).toBe(1.01)
    expect(round(2.675)).toBe(2.68)
    expect(round(8.615)).toBe(8.62)
  })

  it('clears the noise binary addition leaves behind', () => {
    expect(round(0.1 + 0.2)).toBe(0.3)
    expect(round(1.1 * 3)).toBe(3.3)
  })

  it('sends a negative tie towards positive infinity', () => {
    expect(round(-1.005)).toBe(-1)
    expect(round(-1.006)).toBe(-1.01)
  })

  it('answers for numbers no sum of money reaches', () => {
    expect(round(1e21)).toBe(1e21)
    expect(round(Number.MAX_VALUE)).toBe(Number.MAX_VALUE)
  })

  it('hands back what is not a number', () => {
    expect(round(NaN)).toBeNaN()
    expect(round(Infinity)).toBe(Infinity)
  })

  it('keeps zero unsigned', () => {
    expect(round(-0)).toBe(0)
    expect(round(-0.004)).toBe(0)
    expect(round(110 - 100 * 1.1)).toBe(0)
  })

  it('rounds amounts on either side of a half cent without treating them as ties', () => {
    expect(round(2.6749999999999994)).toBe(2.67)
    expect(round(2.6750000000000003)).toBe(2.68)
    expect(round(-2.6750000000000003)).toBe(-2.68)
  })

  it('rounds positive and negative half cents towards positive infinity', () => {
    expect(round(0.005)).toBe(0.01)
    expect(round(-0.005)).toBe(0)
  })
})
