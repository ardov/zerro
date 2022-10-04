import { getLatestRates, getRates } from './getFxRates'
import { getFxRatesGetter } from './getFxRatesGetter'
import {
  editRates,
  freezeCurrentRates,
  loadRates,
  resetRates,
} from './patchRates'

export type { TFxRateData } from './getFxRates'
export type { TFxRates } from './fxRateStore'

export const fxRates = {
  get: getRates,
  getter: getFxRatesGetter,
  latest: getLatestRates,
  edit: editRates,
  reset: resetRates,
  freezeCurrent: freezeCurrentRates,
  freeze: loadRates,
}
