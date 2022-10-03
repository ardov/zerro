import { getRates } from './getFxRates'
import { getFxRatesGetter } from './getFxRatesGetter'
import { editRates, freezeRates, resetRates } from './patchRates'

export type { TFxRateData } from './getFxRates'
export type { TFxRates } from './fxRateStore'

export const fxRates = {
  get: getRates,
  getter: getFxRatesGetter,
  edit: editRates,
  reset: resetRates,
  freeze: freezeRates,
}
