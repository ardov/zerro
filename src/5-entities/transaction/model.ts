import { createSelector } from '@reduxjs/toolkit'
import { compareTrDates, isDeleted } from './helpers'
import { RootState, TSelector } from 'store'
import { withPerf } from '6-shared/helpers/performance'
import { TISODate } from '6-shared/types'
import { toISODate } from '6-shared/helpers/date'

export const getTransactionsById = (state: RootState) =>
  state.data.current.transaction

/**
 * Transactions sorted from newest to oldest
 */
export const getSortedTransactions = createSelector(
  [getTransactionsById],
  withPerf('getSortedTransactions', transactions =>
    Object.values(transactions).sort(compareTrDates)
  )
)

/**
 * Transactions sorted from oldest to newest without deleted
 */
export const getTransactionsHistory = createSelector(
  [getSortedTransactions],
  withPerf('getTransactionsHistory', transactions =>
    transactions.filter(tr => !isDeleted(tr)).reverse()
  )
)

export const getHistoryStart: TSelector<TISODate> = createSelector(
  [getTransactionsHistory],
  history => {
    const firstReasonableDate = '2000-01-01' as TISODate
    const currentDate = toISODate(new Date())
    const firstTr = history.find(
      tr => tr.date >= firstReasonableDate && tr.date <= currentDate
    )
    if (!firstTr) return currentDate
    return firstTr.date
  }
)
