import type { TFxAmount, TFxCode } from '@/6-shared/types'
import { keys } from '@/6-shared/helpers/keys'

/** Zenmoney denotes millionths of a coin with Greek mu or the micro sign. */
export function unitsPerWhole(symbol: string | undefined): number {
  return symbol && /^[μµ]/u.test(symbol) ? 1_000_000 : 1
}

/** Half-cent ties go toward positive infinity. Keep this in sync with zerro-core/internal/domain/foundation/numbers.ts. */
export function round(amount: number): number {
  if (!Number.isFinite(amount)) return amount
  if (amount === 0) return 0
  // Away from a half-cent, multiplication is safely within the rounding margin.
  const cents = amount * 100
  const whole = Math.round(cents)
  const margin = Math.max(1e-9, Math.abs(cents) * 8 * Number.EPSILON)
  if (
    Math.abs(cents) < 2 ** 52 &&
    Math.abs(Math.abs(cents - whole) - 0.5) > margin
  ) {
    return whole / 100 + 0
  }
  // Shift the printed decimal near ties: 1.005 * 100 falls below 100.5 in binary.
  const shifted = Number(`${amount}e2`)
  // At this point only large amounts can print with an exponent. They are
  // already whole numbers.
  if (!Number.isFinite(shifted)) return amount
  const rounded = Number(`${Math.round(shifted)}e-2`)
  return Number.isFinite(rounded) ? rounded : amount
}

export function add(...params: number[]): number {
  return params.reduce((acc, cur) => round(acc + cur), 0)
}

export function sub(first: number, ...params: number[]): number {
  return params.reduce((acc, cur) => round(acc - cur), first)
}

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
