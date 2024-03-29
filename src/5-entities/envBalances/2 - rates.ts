import { ByMonth } from '6-shared/types'
import { fxRateModel, TFxRateData } from '5-entities/currency/fxRate'
import { TSelector } from 'store/index'
import { createSelector } from '@reduxjs/toolkit'
import { withPerf } from '6-shared/helpers/performance'
import { getMonthList } from './1 - monthList'

export const getRatesByMonth: TSelector<ByMonth<TFxRateData>> = createSelector(
  [getMonthList, fxRateModel.getter],
  withPerf('🖤 getRatesByMonth', (months, getter) => {
    const res: ByMonth<TFxRateData> = {}
    months.forEach(month => (res[month] = getter(month)))
    return res
  })
)
