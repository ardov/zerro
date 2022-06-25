import { createSelector } from '@reduxjs/toolkit'
import { makeDateArray, monthEnd } from 'shared/helpers/dateHelpers'
import { getHistoryStart } from 'models/data/transactions'

export const getAvailableMonths = createSelector([getHistoryStart], start =>
  makeDateArray(start).map(monthEnd)
)
