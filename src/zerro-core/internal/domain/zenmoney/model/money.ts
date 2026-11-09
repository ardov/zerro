// Currency-specific amounts are Zenmoney domain values. Generic rounding stays
// in foundation so this module has no reverse dependency.
import { MoneyDecimal } from '../../foundation/decimal'
import { keys } from '../../foundation/keys'
import { round } from '../../foundation/numbers'
import type { TFxCode } from '../entities/instruments'

/** Money amounts by currency code */
export type TFxAmount = Record<TFxCode, number>
export type TRates = Record<TFxCode, number>

function sub(first: number, ...params: number[]): number {
  return params.reduce((acc, cur) => round(acc - cur), first)
}

export function addFxAmount(...amounts: TFxAmount[]): TFxAmount {
  return sumFxAmounts(amounts, (a, b) => round(a + b))
}

/** Preserve native posting precision while adding income, spending and transfer legs. */
export function addTransactionAmounts(...amounts: TFxAmount[]): TFxAmount {
  return sumFxAmounts(amounts, (a, b) => {
    if (a === 0 || b === 0) return a + b
    const left = Math.round(a * 10_000)
    const right = Math.round(b * 10_000)
    if (
      left / 10_000 === a &&
      right / 10_000 === b &&
      Math.abs(left) + Math.abs(right) < 2 ** 52
    )
      return (left + right) / 10_000
    return new MoneyDecimal(a).plus(b).toNumber()
  })
}

function sumFxAmounts(
  amounts: TFxAmount[],
  add: (a: number, b: number) => number
): TFxAmount {
  return amounts.reduce((acc, curr) => {
    for (const fx in curr) {
      acc[fx] = add(acc[fx] || 0, curr[fx])
    }
    return acc
  }, {} as TFxAmount)
}

export function subFxAmount(acc: TFxAmount, fxAmount: TFxAmount): TFxAmount {
  const copy: TFxAmount = { ...acc }
  keys(fxAmount).forEach(fx => {
    copy[fx] ??= 0
    copy[fx] = sub(copy[fx], fxAmount[fx])
  })
  return copy
}

export function isZero(a: TFxAmount): boolean {
  const currencies = keys(a)
  for (const fx of currencies) {
    if (a[fx]) return false
  }
  return true
}

export function convertFx(
  fxAmount: TFxAmount,
  targetFxCode: TFxCode,
  rates: TRates
): number {
  let result = 0
  keys(fxAmount).forEach(fx => {
    result = round(result + (fxAmount[fx] * rates[fx]) / rates[targetFxCode])
  })
  return result
}

// A valuation for comparisons and ratios. Sum in the common quote currency
// before dividing so balanced currency legs cancel at their decimal rates.
export function convertFxUnrounded(
  amount: TFxAmount,
  target: TFxCode,
  rates: TRates
): number {
  const currencies = keys(amount)
  if (currencies.length === 1 && currencies[0] === target) return amount[target]
  if (!currencies.length) return 0

  let value = new MoneyDecimal(0)
  for (const code of currencies) {
    if (amount[code] === 0) continue
    const rate = rates[code]
    if (!(rate > 0) || !Number.isFinite(rate) || !Number.isFinite(amount[code]))
      return NaN
    value = value.plus(new MoneyDecimal(amount[code]).times(rate))
  }
  if (value.isZero()) return 0
  const targetRate = rates[target]
  if (!(targetRate > 0) || !Number.isFinite(targetRate)) return NaN
  return value.div(targetRate).toNumber()
}
