import { createSelector } from '@reduxjs/toolkit'
import { makeDateArray, monthEnd } from 'helpers/dateHelpers'
import { getHistoryStart } from 'store/data/transactions'

export const getAvailableMonths = createSelector([getHistoryStart], start =>
  makeDateArray(start).map(monthEnd)
)
