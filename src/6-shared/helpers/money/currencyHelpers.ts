import type { TFxAmount, TFxCode } from '@/6-shared/types'
import { keys } from '@/6-shared/helpers/keys'

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

export function isZero(a: TFxAmount): boolean {
  const currencies = keys(a)
  for (const fx of currencies) {
    if (a[fx]) return false
  }
  return true
}

export function getAverage(numbers: number[]): number {
  if (!numbers.length) return 0
  const sum = numbers.reduce((acc, val) => acc + val, 0)
  return round(sum / numbers.length)
}
