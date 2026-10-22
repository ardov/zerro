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
    expect(Object.is(round(-0), 0)).toBe(true)
    expect(Object.is(round(-0.004), 0)).toBe(true)
  })

  it('leaves amounts printed with an exponent as they are', () => {
    expect(round(1e-7)).toBe(1e-7)
    expect(round(-3e-9)).toBe(-3e-9)
  })

  it('follows the printed-form rule on everyday amounts and near-ties', () => {
    for (const amount of sampleAmounts()) {
      expect(round(amount), String(amount)).toBe(printedFormRound(amount))
    }
  })
})

/** The rule itself, spelled out slowly: shift the decimal point in the
 * number's shortest printed form, round, and shift it back. */
function printedFormRound(amount: number): number {
  if (!Number.isFinite(amount)) return amount
  const shifted = Number(`${amount}e2`)
  if (!Number.isFinite(shifted)) return amount
  const rounded = Number(`${Math.round(shifted)}e-2`)
  return Number.isFinite(rounded) ? rounded : amount
}

/** Deterministic amounts across magnitudes, with exact and inexact half
 * cents, sums that leave binary noise, and negatives. */
function sampleAmounts(): number[] {
  let seed = 7
  const next = () => (seed = (seed * 48271) % 2147483647) / 2147483647
  const amounts: number[] = []
  for (let i = 0; i < 20000; i++) {
    const scale = 10 ** Math.floor(next() * 12)
    const sign = next() < 0.3 ? -1 : 1
    const cents = Math.floor(next() * scale * 100)
    amounts.push(sign * next() * scale)
    amounts.push(sign * (cents / 100 + 0.005))
    amounts.push(sign * (cents / 1000))
    amounts.push(sign * (cents / 100) + 0.1 + 0.2)
  }
  return amounts
}
