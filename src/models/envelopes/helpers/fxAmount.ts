import { TFxCode } from 'shared/types'
import { add, sub } from 'shared/helpers/currencyHelpers'
import { keys } from 'shared/helpers/keys'

export type TFxAmount = Record<TFxCode, number>

export function addFxAmount(...amounts: TFxAmount[]): TFxAmount {
  return amounts.reduce((acc, curr) => {
    keys(curr).forEach(fx => {
      acc[fx] = add(acc[fx] || 0, curr[fx] || 0)
    })
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
  keys(a1).forEach(fx => {
    if (a1[fx] !== a2[fx]) return false
  })
  keys(a2).forEach(fx => {
    if (a1[fx] !== a2[fx]) return false
  })
  return true
}

export function convertFx(
  fxAmount: TFxAmount,
  targetFxCode: TFxCode,
  rates: Record<TFxCode, number>
): number {
  let result = 0
  keys(fxAmount).forEach(fx => {
    result = add(result, (fxAmount[fx] * rates[fx]) / rates[targetFxCode])
  })
  return result
}
