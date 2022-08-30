import { HiddenDataType, makeMonthlyHiddenStore } from '@entities/hidden-store'
import { TFxCode } from '@shared/types'

export type TFxRates = Record<TFxCode, number>

export const fxRateStore = makeMonthlyHiddenStore<TFxRates>(
  HiddenDataType.FxRates
)
