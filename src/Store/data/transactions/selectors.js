import createSelector from 'selectorator'
import { getInstruments } from 'store/data/instruments'
import { getPopulatedAccounts } from 'store/data/accounts'
import { getUsers } from 'store/data/users'
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
  ['data.transaction.server', 'diff.transaction.diff'],
  (transactions, diff) => ({ ...transactions, ...diff })
)
const getTransaction = (state, id) => getTransactions(state)[id]

const getPopulatedTransactions = createSelector(
  [
    getInstruments,
    getPopulatedAccounts,
    getUsers,
    getPopulatedTags,
    getMerchants,
    getTransactions,
  ],
  (instruments, accounts, users, tags, merchants, transactions) => {
    const result = {}
    for (const id in transactions) {
      result[id] = populate(
        { instruments, accounts, users, tags, merchants },
        transactions[id]
      )
    }
    return result
  }
)

const getPopulatedTransaction = (state, id) =>
  getPopulatedTransactions(state)[id]

const getTransactionList = createSelector(
  [getPopulatedTransactions],
  transactions => {
    let list = []
    for (let id in transactions) {
      list.push(transactions[id])
    }
    return list.sort(sortBy('DATE'))
  }
)

const getOpenedTransaction = createSelector(
  [getPopulatedTransactions, 'openedTransaction'],
  (transactions, openedId) => transactions[openedId]
)

const getTransactionList2 = (state, options) => {
  const { ids, conditions, groupBy, sortType, ascending } = options
  const filterConditions =
    conditions || conditions === null ? conditions : getFilterConditions(state)
  const list = ids
    ? ids.map(id => getPopulatedTransaction(state, id))
    : getTransactionList(state)
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
  getTransactionList,
  getOpenedTransaction,
  getTransactionList2,
}
