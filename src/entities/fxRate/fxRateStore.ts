import {
  HiddenDataType,
  makeMonthlyHiddenStore,
} from '@entities/shared/hidden-store'
import { TFxCode, TISOMonth, TMsTime } from '@shared/types'

export type TFxRates = Record<TFxCode, number>

export type TFxRatesStoredValue = {
  date: TISOMonth
  changed: TMsTime
  rates: TFxRates
}

export const fxRateStore = makeMonthlyHiddenStore<TFxRatesStoredValue>(
  HiddenDataType.FxRates
)
