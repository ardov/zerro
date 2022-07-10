import { TFxCode, TInstrumentId } from 'shared/types'
import { add, sub } from 'shared/helpers/currencyHelpers'
import { keys } from 'shared/helpers/keys'

export type TInstAmount = Record<TInstrumentId, number>
export type TFxAmount = Record<TFxCode, number>

export function addFxAmount(
  acc: TInstAmount,
  fxAmount: TInstAmount
): TInstAmount {
  let copy: TInstAmount = { ...acc }
  keys(fxAmount).forEach(fx => {
    copy[fx] ??= 0
    copy[fx] = add(copy[fx], fxAmount[fx])
  })
  return copy
}

export function subFxAmount(
  acc: TInstAmount,
  fxAmount: TInstAmount
): TInstAmount {
  let copy: TInstAmount = { ...acc }
  keys(fxAmount).forEach(fx => {
    copy[fx] ??= 0
    copy[fx] = sub(copy[fx], fxAmount[fx])
  })
  return copy
}
