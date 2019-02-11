import { populate, checkTransaction } from './helpers'
import { groupTransactionsAndReturnId } from '../Utils/transactions'
import moize from 'moize'
import { createSelector } from 'reselect'

export const getTransactions = state => (options = {}) => {
  const limit = options.limit || 0
  const offset = options.offset || 0
  const conditions = options.conditions || state.filterConditions
  const transactions = state.data.transaction
  const fakes = state.fakeTransactions
  const list = []

  for (const id in transactions) {
    if (fakes[id]) {
      list.push(populate(state, fakes[id]))
      console.log('FOUND IN FAKES', fakes[id])
    } else {
      list.push(populate(state, transactions[id]))
    }
  }

  return list
    .filter(checkTransaction(conditions))
    .sort((a, b) =>
      +b.date === +a.date ? b.created - a.created : b.date - a.date
    )
    .slice(offset, limit ? limit + offset : undefined)
}

export const getListOfTransactionsId = state => (options = {}) => {
  const limit = options.limit || 0
  const offset = options.offset || 0
  const transactions = state.transaction
  const list = []

  for (const id in transactions) {
    list.push(id)
  }

  return list.slice(offset, limit ? limit + offset : undefined)
}

export const getGrouppedIds = moize(function(state, options = {}) {
  return groupTransactionsAndReturnId('day', getTransactions(state)(options))
})
export const getGrouppedIds2 = createSelector()

export const getElement = state => (type, id) => {
  if (type === 'transaction' && state.fakeTransactions[id]) {
    return populate(state, state.fakeTransactions[id])
  } else {
    return populate(state, state.data[type][id])
  }
}

const getTransactionEl = (state, id) => {
  if (state.fakeTransactions[id]) {
    return populate(state, state.fakeTransactions[id])
  } else {
    return populate(state, state.data.transaction[id])
  }
}
export const getTransaction = createSelector(
  getTransactionEl,
  tr => tr
)
export const makeGetTransaction = () =>
  createSelector(
    getTransactionEl,
    tr => tr
  )

export const getTags = state => () => {
  const tags = state.data.tag
  const list = []
  for (const id in tags) {
    list.push(populate(state, tags[id]))
  }
  const topLevel = list.filter(tag => !tag.parent)
  list
    .filter(tag => tag.parent)
    .forEach(tag => {
      const parent = topLevel.find(topTag => topTag.id === tag.parent)
      if (parent.children) {
        parent.children.push(tag)
      } else {
        parent.children = [tag]
      }
    })

  return topLevel
}

export const getOpenedId = state => () => state.openedTransaction
export const getOpened = state => () => {
  const id = state.openedTransaction
  if (id) {
    return getElement(state)('transaction', id)
  } else {
    return null
  }
}

export const getFilterConditions = state => () => {
  return state.filterConditions
}

export const getLoginState = state => () => {
  return !!state.token
}
