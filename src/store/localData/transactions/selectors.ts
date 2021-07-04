import { createSelector } from '@reduxjs/toolkit'
import { getInstruments } from 'store/data/selectors'
import { getAccounts } from 'store/localData/accounts'
import { getPopulatedTags } from 'store/localData/tags'
import { compareDates } from './helpers'
import { populate, PopulatedTransaction } from './populate'
import { RootState } from 'store'
import { TransactionId } from 'types'
import { withPerf } from 'helpers/performance'

const getTransactions = (state: RootState) => state.data.current.transaction
const getTransaction = (state: RootState, id: TransactionId) =>
  getTransactions(state)[id]

// Only for CSV
const getPopulatedTransactions = createSelector(
  [getInstruments, getAccounts, getPopulatedTags, getTransactions],
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
    Object.values(transactions).sort(compareDates)
  )
)

const getTransactionsHistory = createSelector(
  [getSortedTransactions],
  withPerf('getTransactionsHistory', transactions =>
    transactions.filter(tr => !tr.deleted).reverse()
  )
)

export const selectors = {
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
  getSortedTransactions,
  getTransactionsHistory,
}
