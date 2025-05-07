import { TFxAmount, TFxCode, TRates } from '6-shared/types'
import { keys } from '6-shared/helpers/keys'

export const round = (amount: number): number => Math.round(amount * 100) / 100

export function add(...params: number[]): number {
  return params.reduce((acc, cur) => round(acc + cur), 0)
}

export function sub(first: number, ...params: number[]): number {
  return params.reduce((acc, cur) => round(acc - cur), first)
}

// Helpers for currency objects

export function createFxAmount(currency: TFxCode, value: number): TFxAmount {
  return { [currency]: value }
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
  let copy: TFxAmount = { ...acc }
  keys(fxAmount).forEach(fx => {
    copy[fx] ??= 0
    copy[fx] = sub(copy[fx], fxAmount[fx])
  })
  return copy
}

export function isEqualFxAmount(a1: TFxAmount, a2: TFxAmount): boolean {
  const currencies = keys(a1).concat(keys(a2))
  for (const fx of currencies) {
    if (a1[fx] !== a2[fx]) return false
  }
  return true
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

export function getAverage(numbers: number[]): number {
  if (!numbers.length) return 0
  const sum = numbers.reduce((acc, val) => acc + val, 0)
  return round(sum / numbers.length)
}

export function getMedian(numbers: number[]): number {
  if (!numbers.length) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  return round(median)
}
