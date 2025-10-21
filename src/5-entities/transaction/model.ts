import { createSelector } from '@reduxjs/toolkit'
import { compareTrDates, getType, isDeleted, TrType } from './helpers'
import { TSelector } from 'store'
import { withPerf } from '6-shared/helpers/performance'
import { ById, TISODate, TTransaction, TTransactionId } from '6-shared/types'
import { toISODate } from '6-shared/helpers/date'
import { getDebtAccountId } from 'store/data/selectors'

export const getTransactionsById: TSelector<ById<TTransaction>> = state => {
  return state.data.current.transaction
}

/** 🟢 Transaction IDs sorted from oldest to newest */
export const getTransactionIds: TSelector<TTransactionId[]> = createSelector(
  [getTransactionsById],
  withPerf('getTransactionIds', transactions =>
    Object.values(transactions)
      .sort(compareTrDates)
      .reverse()
      .map(tr => tr.id)
  )
)

/** 🔴 Transactions sorted from oldest to newest without deleted */
export const getTransactionsHistory = createSelector(
  [getTransactionsById],
  withPerf('getTransactionsHistory', transactions =>
    Object.values(transactions)
      .filter(tr => !isDeleted(tr))
      .sort(compareTrDates)
      .reverse()
  )
)

// NEW ID-BASED SELECTORS

/** 🟢 Get a single transaction by ID (memoized) */
export const getTransaction: TSelector<
  TTransaction | undefined,
  TTransactionId
> = createSelector([getTransactionsById, (_, id) => id], (transactions, id) =>
  id ? transactions[id] : undefined
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

export const getTrTypeGetter: TSelector<(tr: TTransaction) => TrType> =
  createSelector([getDebtAccountId], debtId => {
    return (tr: TTransaction) => getType(tr, debtId)
  })
