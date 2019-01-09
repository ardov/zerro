export const getTransactions = (state, populate, check) => (options = {}) => {
  const limit = options.limit || 0
  const offset = options.offset || 0
  const conditions = options.conditions || state.filterConditions

  const transactions = state.transaction
  const list = []
  for (const id in transactions) {
    list.push(populate(transactions[id], state))
  }

  return list
    .filter(check(conditions))
    .sort((a, b) =>
      +b.date === +a.date ? b.created - a.created : b.date - a.date
    )
    .slice(offset, limit ? limit + offset : undefined)
}

export const getElement = (state, populate) => (type, id) => {
  return populate(state[type][id], state)
}

export const getTags = (state, populate) => () => {
  const tags = state.tag
  const list = []
  for (const id in tags) {
    list.push(populate(tags[id], state))
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
