import { ByMonth } from '@shared/types'
import { fxRateModel, TFxRateData } from '@entities/fxRate'
import { TSelector } from '@store/index'
import { createSelector } from '@reduxjs/toolkit'
import { withPerf } from '@shared/helpers/performance'
import { getMonthList } from './1 - monthList'

export const getRatesByMonth: TSelector<ByMonth<TFxRateData>> = createSelector(
  [getMonthList, fxRateModel.getter],
  withPerf('🖤 getRatesByMonth', (months, getter) => {
    const res: ByMonth<TFxRateData> = {}
    months.forEach(month => (res[month] = getter(month)))
    return res
  })
)
