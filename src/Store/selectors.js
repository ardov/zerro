import { populate, checkTransaction } from './helpers'
import { groupTransactionsAndReturnId } from '../Utils/transactions'
import createSelector from 'selectorator'

const options = (_, options) => options
const defaultOptions = {}

export const getTransactions = createSelector(
  ['data', 'filterConditions', 'fakeTransactions', options],
  (data, filterConditions, fakeTransactions, options = defaultOptions) => {
    const limit = options.limit || 0
    const offset = options.offset || 0
    const conditions = options.conditions || filterConditions
    const transactions = data.transaction
    const fakes = fakeTransactions
    const list = []

    for (const id in transactions) {
      if (fakes[id]) {
        list.push(populate(data, fakes[id]))
      } else {
        list.push(populate(data, transactions[id]))
      }
    }

    return list
      .filter(checkTransaction(conditions))
      .sort((a, b) =>
        +b.date === +a.date ? b.created - a.created : b.date - a.date
      )
      .slice(offset, limit ? limit + offset : undefined)
  }
)

export const getGrouppedIds2 = createSelector(
  [getTransactions],
  transactions => groupTransactionsAndReturnId('day', transactions)
)

export const getElement = state => (type, id) => {
  if (type === 'transaction' && state.fakeTransactions[id]) {
    return populate(state.data, state.fakeTransactions[id])
  } else {
    return populate(state.data, state.data[type][id])
  }
}

export const getLoginState = state => () => !!state.token
