import { createSelector } from '@reduxjs/toolkit'
import { makeDateArray, endOfMonth } from 'shared/helpers/date'
import { getHistoryStart } from 'models/transactions'

export const getAvailableMonths = createSelector([getHistoryStart], start =>
  makeDateArray(start).map(endOfMonth)
)
