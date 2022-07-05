import { TInstrumentId } from 'shared/types'
import { add, sub } from 'shared/helpers/currencyHelpers'
import { keys } from 'shared/helpers/keys'

export type TFxAmount = Record<TInstrumentId, number>

export function addFxAmount(acc: TFxAmount, fxAmount: TFxAmount): TFxAmount {
  let copy: TFxAmount = { ...acc }
  keys(fxAmount).forEach(fx => {
    copy[fx] ??= 0
    copy[fx] = add(copy[fx], fxAmount[fx])
  })
  return copy
}

export function subFxAmount(acc: TFxAmount, fxAmount: TFxAmount): TFxAmount {
  let copy: TFxAmount = { ...acc }
  keys(fxAmount).forEach(fx => {
    copy[fx] ??= 0
    copy[fx] = sub(copy[fx], fxAmount[fx])
  })
  return copy
}
