import type { TCoreContext, TNormalizedPatch } from '../../types'
import type { TISOMonth } from '../../zenmoney/primitives'
import type { TDataStore } from '../../zenmoney/store'
import {
  compileResetMonthlyHiddenData,
  compileSetMonthlyHiddenData,
  HiddenDataType,
} from '../hidden-data'
import type { TFxRates, TFxRatesStoredValue } from './read'

export function compileSetFxRates(
  data: TDataStore,
  month: TISOMonth,
  rates: TFxRates,
  ctx: TCoreContext
): TNormalizedPatch {
  const payload: TFxRatesStoredValue = {
    date: month,
    changed: ctx.now(),
    rates,
  }
  return compileSetMonthlyHiddenData(
    data,
    HiddenDataType.FxRates,
    payload,
    month,
    ctx
  )
}

export function compileResetFxRates(
  data: TDataStore,
  month: TISOMonth,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return compileResetMonthlyHiddenData(data, HiddenDataType.FxRates, month, ctx)
}
