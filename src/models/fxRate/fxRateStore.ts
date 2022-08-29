import { HiddenDataType, makeMonthlyHiddenStore } from '@models/hidden-store'
import { TFxCode } from '@shared/types'

export type TFxRates = Record<TFxCode, number>

export const fxRateStore = makeMonthlyHiddenStore<TFxRates>(
  HiddenDataType.FxRates
)
