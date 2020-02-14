import { combineReducers } from 'redux-starter-kit'

import tag, { getTagsToSync } from './tags'
import budget, { getBudgetsToSync } from './budgets'
import account, { getAccountsToSync } from './accounts'
import reminder, { getRemindersToSync } from './reminders'
import transaction, { getTransactionsToSync } from './transactions'

// REDUCER
export default combineReducers({
  tag,
  budget,
  account,
  reminder,
  transaction,
})

// GLOBAL SELECTORS
export const getChangedArrays = state => ({
  tag: getTagsToSync(state),
  budget: getBudgetsToSync(state),
  account: getAccountsToSync(state),
  reminder: getRemindersToSync(state),
  transaction: getTransactionsToSync(state),
})

export const getChangedNum = state => {
  const arrays = getChangedArrays(state)
  return Object.values(arrays).reduce((sum, arr) => sum + arr.length, 0)
}

export const getLastChangeTime = state => {
  const arrays = getChangedArrays(state)
  let lastChange = 0
  for (const key in arrays) {
    // eslint-disable-next-line no-loop-func
    arrays[key].forEach(item => {
      lastChange = Math.max(item.changed, lastChange)
    })
  }

  return lastChange * 1000
}
