export { setGoal as set } from './commands'
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'store'
import { buildGoals, buildGoalTotals } from '../domain/zerro'
import { graph } from './graph'
import * as activity from './activity'
import * as fxRates from './fxRates'
import * as months from './months'

export const selectRawGoals = (state: RootState) =>
  graph.rawGoals(state.data.current)
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
export { goalType, type TGoal, type TGoalInfo } from '../domain/zerro/goals'
