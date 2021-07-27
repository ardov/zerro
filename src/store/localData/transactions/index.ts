import { createSelector } from '@reduxjs/toolkit'
import { getInstruments, getMerchants } from 'store/data/selectors'
import { getAccounts } from 'store/localData/accounts'
import { getPopulatedTags } from 'store/localData/tags'
import { compareDates, getTime } from './helpers'
import { populate, PopulatedTransaction } from './populate'
import { RootState } from 'store'
import { Transaction, TransactionId } from 'types'
import { withPerf } from 'helpers/performance'

export const getTransactions = (state: RootState) =>
  state.data.current.transaction
export const getTransaction = (state: RootState, id: TransactionId) =>
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
    transactions.filter(tr => !tr.deleted).reverse()
  )
)

export const getHistoryStart = createSelector(
  [getTransactionsHistory],
  transactions => {
    if (!transactions.length) return Date.now()
    return +getTime(transactions[0])
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
