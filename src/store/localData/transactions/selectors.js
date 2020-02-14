import createSelector from 'selectorator'
import { getInstruments } from 'store/serverData'
import { getPopulatedAccounts } from 'store/localData/accounts'
import { getPopulatedTags } from 'store/localData/tags'
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
  convertToSyncArray(state.localData.transaction)

const getTransactions = createSelector(
  ['serverData.transaction', 'localData.transaction'],
  (transactions, diff) => ({ ...transactions, ...diff })
)
const getTransaction = (state, id) => getTransactions(state)[id]

const getPopulatedTransactions = createSelector(
  [getInstruments, getPopulatedAccounts, getPopulatedTags, getTransactions],
  (instruments, accounts, tags, transactions) => {
    const result = {}
    for (const id in transactions) {
      result[id] = populate({ instruments, accounts, tags }, transactions[id])
    }
    return result
  }
)

const getPopulatedTransaction = (state, id) =>
  getPopulatedTransactions(state)[id]

const getSortedTransactions = createSelector([getTransactions], transactions =>
  Object.values(transactions).sort(sortBy('DATE'))
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
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
  getPopulatedTransaction,
  getTransactionList,
  getSortedTransactions,
}
