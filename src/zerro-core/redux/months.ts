import { createSelector } from '@reduxjs/toolkit'
import { buildMonthTotals } from '../domain/zerro'
import * as activity from './activity'
import * as fxRates from './fxRates'
import * as monthList from './monthList'
import { selectCurrentMonth } from './state'

export const selectList = monthList.selectList
export const selectTotals = createSelector(
  [
    monthList.selectList,
    activity.selectCurrentFunds,
    activity.selectAll,
    activity.selectEnvelopeMetrics,
    fxRates.selectConvertFx,
    selectCurrentMonth,
  ],
  (monthList, currentFunds, activityData, envMetrics, convertFx, currentMonth) =>
    buildMonthTotals({
      monthList,
      currentFunds,
      activity: activityData,
      envMetrics,
      convertFx,
      currentMonth,
    })
)
