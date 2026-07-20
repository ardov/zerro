import type { TCoreContext, TIntentPatch } from '../../../types'
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
): TIntentPatch {
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
  month: TISOMonth
): TIntentPatch {
  return compileResetMonthlyHiddenData(data, HiddenDataType.FxRates, month)
}
