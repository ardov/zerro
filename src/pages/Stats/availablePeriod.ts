import { createSelector } from '@reduxjs/toolkit'
import { makeDateArray, monthEnd } from 'shared/helpers/date'
import { getHistoryStart } from 'models/transactions'

export const getAvailableMonths = createSelector([getHistoryStart], start =>
  makeDateArray(start).map(monthEnd)
)
