import { createSelector } from '@reduxjs/toolkit'
import { getInstruments } from 'store/serverData'
import { getPopulatedAccounts } from 'store/localData/accounts'
import { getPopulatedTags } from 'store/localData/tags'
import { sortBy } from './helpers'
import { convertToSyncArray } from 'helpers/converters'
import { populate, PopulatedTransaction } from './populate'
import { RootState } from 'store'
import { TransactionId, ZmTransaction } from 'types'
import { withPerf } from 'helpers/performance'

const getServerTransactions = (state: RootState) => state.serverData.transaction
const getLocalTransactions = (state: RootState) => state.localData.transaction
const getTransactionsToSync = (state: RootState) =>
  convertToSyncArray(state.localData.transaction) as ZmTransaction[]

const getTransactions = createSelector(
  [getServerTransactions, getLocalTransactions],
  (transactions, diff) => ({ ...transactions, ...diff })
)
const getTransaction = (state: RootState, id: TransactionId) =>
  getTransactions(state)[id]

// Only for CSV
const getPopulatedTransactions = createSelector(
  [getInstruments, getPopulatedAccounts, getPopulatedTags, getTransactions],
  (instruments, accounts, tags, transactions) => {
    const result: { [id: string]: PopulatedTransaction } = {}
    for (const id in transactions) {
      result[id] = populate({ instruments, accounts, tags }, transactions[id])
    }
    return result
  }
)

const getSortedTransactions = createSelector(
  [getTransactions],
  withPerf('getSortedTransactions', transactions =>
    Object.values(transactions).sort(sortBy('DATE'))
  )
)

const getTransactionsHistory = createSelector(
  [getSortedTransactions],
  withPerf('getTransactionsHistory', transactions =>
    transactions.filter(tr => !tr.deleted).reverse()
  )
)

export const selectors = {
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
  getSortedTransactions,
  getTransactionsHistory,
}
