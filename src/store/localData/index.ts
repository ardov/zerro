import { combineReducers } from '@reduxjs/toolkit'

import tag, { getTagsToSync } from './tags'
import budget, { getBudgetsToSync } from './budgets'
import account, { getAccountsToSync } from './accounts'
import reminder, { getRemindersToSync } from './reminders'
import transaction, { getTransactionsToSync } from './transactions'
import { RootState } from 'store'

// REDUCER
export default combineReducers({
  tag,
  budget,
  account,
  reminder,
  transaction,
})

// GLOBAL SELECTORS
export const getChangedArrays = (state: RootState) => ({
  tag: getTagsToSync(state),
  budget: getBudgetsToSync(state),
  account: getAccountsToSync(state),
  reminder: getRemindersToSync(state),
  transaction: getTransactionsToSync(state),
})

export const getChangedNum = (state: RootState) => {
  const arrays = getChangedArrays(state)
  return Object.values(arrays).reduce((sum, arr) => sum + arr.length, 0)
}

export const getLastChangeTime = (state: RootState) => {
  const arrays = getChangedArrays(state)
  let lastChange = 0
  Object.values(arrays).forEach(array =>
    array.forEach(item => {
      lastChange = Math.max(item.changed, lastChange)
    })
  )

  return lastChange * 1000
}
