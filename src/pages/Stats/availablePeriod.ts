import { getTransactionsHistory } from '@entities/transaction'
import { createSelector } from '@reduxjs/toolkit'
import { makeDateArray, endOfMonth, toISODate } from '@shared/helpers/date'
import { withPerf } from '@shared/helpers/performance'
import { TISODate } from '@shared/types'
import { TSelector } from '@store/index'

const firstReasonableDate = '2000-01-01'

export const getHistoryStart: TSelector<TISODate> = createSelector(
  [getTransactionsHistory],
  withPerf('getHistoryStart', transactions => {
    for (const tr of transactions) {
      if (tr.date >= firstReasonableDate) return tr.date
    }
    return toISODate(Date.now())
  })
)

export const getAvailableMonths = createSelector([getHistoryStart], start =>
  makeDateArray(start).map(endOfMonth)
)
