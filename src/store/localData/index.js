import { combineReducers } from 'redux-starter-kit'

import tag from './tags'
import budget from './budgets'
import transaction from './transactions'
import { getBudgetsToSync } from './budgets'
import { getTransactionsToSync } from './transactions'
import { getTagsToSync } from './tags'

// REDUCER
export default combineReducers({
  tag,
  budget,
  transaction,
})

// GLOBAL SELECTORS
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
