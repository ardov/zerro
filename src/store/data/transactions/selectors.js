import createSelector from 'selectorator'
import { getInstruments } from 'store/data/serverData'
import { getPopulatedAccounts } from 'store/data/accounts'
import { getPopulatedTags } from 'store/data/tags'
import { getMerchants } from 'store/data/merchants'
import { groupTransactionsBy, sortBy } from './helpers'
import { getFilterConditions, check, checkRaw } from 'store/filterConditions'
import { convertToSyncArray } from 'helpers/converters'
import { populate } from './populate'

// function removeFalseKeys(object) {
//   let newObject = {}
//   Object.keys(object).forEach(key => {
//     if (object[key]) newObject[key] = object[key]
//   })
//   return newObject
// }

const getTransactionsToSync = state =>
  convertToSyncArray(state.data.transaction)

const getTransactions = createSelector(
  ['data.serverData.transaction', 'data.transaction'],
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

const getSortedTransactions = createSelector([getTransactions], transactions =>
  Object.values(transactions).sort(sortBy())
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

const getMainTransactionList = createSelector(
  [getTransactions, getFilterConditions],
  (transactions, filterConditions) => {
    const list = Object.values(transactions)
      .filter(checkRaw(filterConditions))
      .sort(sortBy())
    return groupTransactionsBy('DAY', list)
  }
)

export default {
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
  getPopulatedTransaction,
  getOpenedTransaction,
  getTransactionList,
  getSortedTransactions,
  getMainTransactionList,
}
