// Currency-specific amounts are ZenMoney domain values. Generic rounding stays
// in foundation so this module has no reverse dependency.
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
  return amounts.reduce((acc, curr) => {
    for (const fx in curr) {
      acc[fx] = round((acc[fx] || 0) + curr[fx])
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
