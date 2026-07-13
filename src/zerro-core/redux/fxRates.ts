export { editFxRates as edit, resetFxRates as reset } from './commands'
import { createSelector } from '@reduxjs/toolkit'
import {
  buildCurrentFxRates,
  buildFxConverter,
  buildFxRates,
  buildFxRatesGetter,
  getStoredFxRates,
} from '../domain/zerro'
import * as instruments from './instruments'
import { selectCurrentMonth, selectReminderSlice } from './state'

const selectStoredFxRates = createSelector([selectReminderSlice], reminder =>
  getStoredFxRates({ reminder })
)
export const selectCurrent = createSelector(
  [instruments.selectAll, selectCurrentMonth],
  (instruments, currentMonth) => buildCurrentFxRates({ instruments, currentMonth })
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
