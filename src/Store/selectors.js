import { populate, checkTransaction } from './helpers'

export const getTransactions = state => (options = {}) => {
  const limit = options.limit || 0
  const offset = options.offset || 0
  const conditions = options.conditions || state.filterConditions

  const transactions = state.transaction
  const list = []
  for (const id in transactions) {
    list.push(populate(state, transactions[id]))
  }

  return list
    .filter(checkTransaction(conditions))
    .sort((a, b) =>
      +b.date === +a.date ? b.created - a.created : b.date - a.date
    )
    .slice(offset, limit ? limit + offset : undefined)
}

export const getElement = state => (type, id) => {
  return populate(state, state[type][id])
}

export const getTags = state => () => {
  const tags = state.tag
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
