export { setGoal as set } from './commands'
import { createSelector } from '@reduxjs/toolkit'
import { buildGoals, buildGoalTotals, getRawGoals } from '../domain/zerro'
import * as activity from './activity'
import * as fxRates from './fxRates'
import * as months from './months'
import { selectReminderSlice } from './state'

export const selectRawGoals = createSelector([selectReminderSlice], reminder =>
  getRawGoals({ reminder })
)
export const selectAll = createSelector(
  [
    selectRawGoals,
    months.selectList,
    activity.selectEnvelopeMetrics,
    activity.selectSorted,
    fxRates.selectConvertFx,
  ],
  (rawGoals, monthList, envMetrics, sortedActivity, convertFx) =>
    buildGoals({ rawGoals, monthList, envMetrics, sortedActivity, convertFx })
)
export const selectTotals = createSelector(
  [selectAll, fxRates.selectConvertFx],
  buildGoalTotals
)
export { formatGoal } from './goalPresentation'
export {
  goalType,
  normalizeGoal,
  type TGoal,
  type TGoalInfo,
} from '../domain/zerro/goals'
