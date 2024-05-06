import { useAppSelector } from 'store'
import { getConverter } from './converter'
import { getCurrentRates, getRates } from './getFxRates'
import { getFxRatesGetter } from './getFxRatesGetter'
import {
  canFetchRates,
  editRates,
  freezeCurrentRates,
  loadRates,
  resetRates,
} from './patchRates'

export type { TFxRateData } from './getFxRates'
export type { TFxRates } from './fxRateStore'
export type { TFxConverter } from './converter'

export const fxRateModel = {
  // Selectors
  get: getRates,
  latest: getCurrentRates,
  getter: getFxRatesGetter,
  converter: getConverter,

  // Hooks
  useConverter: () => useAppSelector(getConverter),

  // Thunks
  edit: editRates,
  reset: resetRates,
  freezeCurrent: freezeCurrentRates,
  load: loadRates,

  // Utils
  canFetchRates,
}
