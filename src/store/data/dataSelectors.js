import { getBudgetsToSync } from 'store/data/budgets'
import { getTransactionsToSync } from 'store/data/transactions'
import { getTagsToSync } from 'store/data/tags'

// SELECTOR

export const getChangedArrays = state => ({
  tag: getTagsToSync(state),
  budget: getBudgetsToSync(state),
  transaction: getTransactionsToSync(state),
})

export const getChangedNum = state => {
  const arrays = getChangedArrays(state)
  return Object.values(arrays).reduce((sum, arr) => sum + arr.length, 0)
}

export const getLastChangeTime = state => {
  const arrays = getChangedArrays(state)
  const lastChange = Object.values(arrays).reduce(
    (lastChange, array) =>
      array.reduce(
        (lastChange, item) =>
          item.changed > lastChange ? item.changed : lastChange,
        lastChange
      ),
    0
  )

  return lastChange * 1000
}
