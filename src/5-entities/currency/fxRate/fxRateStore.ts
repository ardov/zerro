// Import directly from the defining modules, not the hidden-store barrel: the
// reminder write path now cycles through the Core Redux adapter back into the
// selector graph, so a barrel re-export binding can still be undefined when this
// module initializes. A direct import of the hoisted factory survives the cycle.
import { HiddenDataType } from '5-entities/shared/hidden-store/types'
import { makeMonthlyHiddenStore } from '5-entities/shared/hidden-store/monthlyStoreFactory'
import { TFxCode, TISOMonth, TMsTime } from '6-shared/types'

export type TFxRates = Record<TFxCode, number>

export type TFxRatesStoredValue = {
  date: TISOMonth
  changed: TMsTime
  rates: TFxRates
}

export const fxRateStore = makeMonthlyHiddenStore<TFxRatesStoredValue>(
  HiddenDataType.FxRates
)
