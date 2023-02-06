import { getConverter } from './converter'
import { getCurrentRates, getRates } from './getFxRates'
import { getFxRatesGetter } from './getFxRatesGetter'
import {
  editRates,
  freezeCurrentRates,
  loadRates,
  resetRates,
} from './patchRates'

export type { TFxRateData } from './getFxRates'
export type { TFxRates } from './fxRateStore'

export const fxRateModel = {
  // Selectors
  get: getRates,
  getter: getFxRatesGetter,
  latest: getCurrentRates,
  converter: getConverter,

  // Thunks
  edit: editRates,
  reset: resetRates,
  freezeCurrent: freezeCurrentRates,
  load: loadRates,
}
