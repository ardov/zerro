import createSelector from 'selectorator'
import { getInstruments } from 'store/data/instruments'
import { getPopulatedAccounts } from 'store/data/accounts'
import { getPopulatedTags } from 'store/data/tags'
import { getMerchants } from 'store/data/merchants'
import { groupTransactionsBy, sortBy } from './helpers'
import { getFilterConditions, check } from 'store/filterConditions'
import { convertToSyncArray } from 'Utils/converters'
import { populate } from './populate'

const getTransactionsToSave = createSelector(
  ['data.transaction.server'],
  transactions => convertToSyncArray(transactions)
)
const getTransactionsToSync = state =>
  convertToSyncArray(state.data.transaction.diff)

const getTransactions = createSelector(
  ['data.transaction.server', 'data.transaction.diff'],
  (transactions, diff) => ({ ...transactions, ...diff })
)
const getTransaction = (state, id) => getTransactions(state)[id]

const getPopulatedTransactions = createSelector(
  [
    getInstruments,
    getPopulatedAccounts,
    getPopulatedTags,
    getMerchants,
    getTransactions,
  ],
  (instruments, accounts, tags, merchants, transactions) => {
    const result = {}
    for (const id in transactions) {
      result[id] = populate(
        { instruments, accounts, tags, merchants },
        transactions[id]
      )
    }
    return result
  }
)

const getPopulatedTransaction = (state, id) =>
  getPopulatedTransactions(state)[id]

const getOpenedTransaction = createSelector(
  [getPopulatedTransactions, 'openedTransaction'],
  (transactions, openedId) => transactions[openedId]
)

const getTransactionList = (state, options = {}) => {
  const { ids, conditions, groupBy, sortType, ascending } = options
  const transactions = getPopulatedTransactions(state)
  const filterConditions =
    conditions || conditions === null ? null : getFilterConditions(state)
  const list = ids
    ? ids.map(id => transactions[id])
    : Object.values(transactions)
  const filtered = list
    .filter(check(filterConditions))
    .sort(sortBy(sortType, ascending))
  return groupBy ? groupTransactionsBy(groupBy, filtered) : filtered
}

export default {
  getTransactionsToSave,
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
  getPopulatedTransaction,
  getOpenedTransaction,
  getTransactionList,
}
