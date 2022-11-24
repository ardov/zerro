import { createSelector } from '@reduxjs/toolkit'
import { getMerchants } from '@entities/merchant'
import { compareTrDates, getTime, isDeleted } from './helpers'
import { RootState, TSelector } from '@store'
import { TTransaction } from '@shared/types'
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

export const getHistoryStart: TSelector<number> = createSelector(
  [getTransactionsHistory],
  withPerf('getHistoryStart', transactions => {
    if (!transactions.length) return Date.now()
    const historyBeginning = new Date(2000, 0)
    for (const tr of transactions) {
      const trTime = getTime(tr)
      if (trTime >= historyBeginning) return +trTime
    }
    return Date.now()
  })
)

export const debtorGetter = createSelector(
  [getMerchants],
  merchants => (tr: TTransaction) => {
    const instrument = tr.incomeInstrument || tr.outcomeInstrument
    const merchantTitle = tr.merchant && merchants[tr.merchant]?.title
    return clean(merchantTitle || tr.payee || '') + '-' + instrument
  }
)

export const clean = (s: string) => s.toLowerCase().replace(/[\s/|{}\\-]/gm, '')
