import createSelector from 'selectorator'
import { getInstruments } from 'store/serverData'
import { getPopulatedAccounts } from 'store/localData/accounts'
import { getPopulatedTags } from 'store/localData/tags'
import { sortBy } from './helpers'
import { convertToSyncArray } from 'helpers/converters'
import { populate } from './populate'

const getTransactionsToSync = state =>
  convertToSyncArray(state.localData.transaction)

const getTransactions = createSelector(
  ['serverData.transaction', 'localData.transaction'],
  (transactions, diff) => ({ ...transactions, ...diff })
)
const getTransaction = (state, id) => getTransactions(state)[id]

// Only for CSV
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
