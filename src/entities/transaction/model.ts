import { createSelector } from '@reduxjs/toolkit'
import { compareTrDates, isDeleted } from './helpers'
import { RootState } from '@store'
import { withPerf } from '@shared/helpers/performance'

export const getTransactions = (state: RootState) =>
  state.data.current.transaction

export const getSortedTransactions = createSelector(
  [getTransactions],
  withPerf('getSortedTransactions', transactions =>
    Object.values(transactions).sort(compareTrDates)
  )
)

export const getTransactionsHistory = createSelector(
  [getSortedTransactions],
  withPerf('getTransactionsHistory', transactions =>
    transactions.filter(tr => !isDeleted(tr)).reverse()
  )
)
