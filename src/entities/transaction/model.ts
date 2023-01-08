import { createSelector } from '@reduxjs/toolkit'
import { compareTrDates, isDeleted } from './helpers'
import { RootState, TSelector } from '@store'
import { withPerf } from '@shared/helpers/performance'
import { TISODate } from '@shared/types'
import { toISODate } from '@shared/helpers/date'

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
