export { editFxRates as edit, resetFxRates as reset } from './commands'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'store'
import {
  buildCurrentFxRates,
  buildFxConverter,
  buildFxRates,
  buildFxRatesGetter,
} from '../domain/zerro'
import { graph } from './graph'
import * as instruments from './instruments'
import { selectCurrentMonth } from './state'

const selectStoredFxRates = (state: RootState) =>
  graph.storedFxRates(state.data.current)
export const selectCurrent = createSelector(
  [instruments.selectAll, selectCurrentMonth],
  (instruments, currentMonth) =>
    buildCurrentFxRates({ instruments, currentMonth })
)
export const selectRates = createSelector(
  [selectStoredFxRates, selectCurrent],
  (storedRates, currentRates) => buildFxRates({ storedRates, currentRates })
)
export const selectGetter = createSelector(
  [selectRates, selectCurrent],
  (rates, currentRates) => buildFxRatesGetter({ rates, currentRates })
)
export const selectConvertFx = createSelector([selectGetter], buildFxConverter)
export type { TFxRates } from '../domain/zerro/fx-rates'
