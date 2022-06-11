import { createSelector } from '@reduxjs/toolkit'
import { getInstruments } from 'store/data/instruments'
import { getMerchants } from 'store/data/selectors'
import { getAccounts } from 'store/data/accounts'
import { getPopulatedTags } from 'store/data/tags'
import { compareDates, getTime, isDeleted } from './helpers'
import { populate, PopulatedTransaction } from './populate'
import { RootState } from 'store'
import { Transaction, TTransactionId } from 'types'
import { withPerf } from 'helpers/performance'

export const getTransactions = (state: RootState) =>
  state.data.current.transaction
export const getTransaction = (state: RootState, id: TTransactionId) =>
  getTransactions(state)[id]

// Only for CSV
export const getPopulatedTransactions = createSelector(
  [getInstruments, getAccounts, getPopulatedTags, getTransactions],
  (instruments, accounts, tags, transactions) => {
    const result: { [id: string]: PopulatedTransaction } = {}
    for (const id in transactions) {
      result[id] = populate({ instruments, accounts, tags }, transactions[id])
    }
    return result
  }
)

export const getSortedTransactions = createSelector(
  [getTransactions],
  withPerf('getSortedTransactions', transactions =>
    Object.values(transactions).sort(compareDates)
  )
)

export const getTransactionsHistory = createSelector(
  [getSortedTransactions],
  withPerf('getTransactionsHistory', transactions =>
    transactions.filter(tr => !isDeleted(tr)).reverse()
  )
)

export const getHistoryStart = createSelector(
  [getTransactionsHistory],
  transactions => {
    if (!transactions.length) return Date.now()
    const historyBeginning = +new Date('2000-01-01')
    for (const tr of transactions) {
      const trTime = getTime(tr)
      if (trTime >= historyBeginning) return trTime
    }
    return Date.now()
  }
)

export const debtorGetter = createSelector(
  [getMerchants],
  merchants => (tr: Transaction) => {
    const instrument = tr.incomeInstrument || tr.outcomeInstrument
    const merchantTitle = tr.merchant && merchants[tr.merchant]?.title
    return clean(merchantTitle || tr.payee || '') + '-' + instrument
  }
)

const clean = (s: string) => s.toLowerCase().replace(/[\s/|{}\\-]/gm, '')
