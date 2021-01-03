import { createSelector } from '@reduxjs/toolkit'
import { getInstruments } from 'store/serverData'
import { getPopulatedAccounts } from 'store/localData/accounts'
import { getPopulatedTags } from 'store/localData/tags'
import { sortBy } from './helpers'
import { convertToSyncArray } from 'helpers/converters'
import { populate, PopulatedTransaction } from './populate'
import { RootState } from 'store'
import { TransactionId, ZmTransaction } from 'types'

const getTransactionsToSync = (state: RootState) =>
  convertToSyncArray(state.localData.transaction) as ZmTransaction[]

const getServerTransactions = (state: RootState) => state.serverData.transaction
const getLocalTransactions = (state: RootState) => state.localData.transaction
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
    const result = {} as { [id: string]: PopulatedTransaction }
    for (const id in transactions) {
      result[id] = populate({ instruments, accounts, tags }, transactions[id])
    }
    return result
  }
)

const getSortedTransactions = createSelector([getTransactions], transactions =>
  Object.values(transactions).sort(sortBy('DATE'))
)

export const selectors = {
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
  getSortedTransactions,
}
