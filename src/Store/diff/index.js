import { combineReducers } from 'redux-starter-kit'
import transaction from './transaction'
import { getBudgetsToSync } from 'store/data/budgets'
// import createSelector from 'selectorator'

// REDUCER
export default combineReducers({ transaction })

// SELECTOR
export const getChangedArrays = state => {
  const budget = getBudgetsToSync(state)
  const {
    transaction,
    // account,
    // tag,
    // budget,
    // merchant,
    // reminder,
    // reminderMarker,
  } = state.diff
  return {
    transaction: Object.values(transaction),
    // account: Object.values(account),
    // tag: Object.values(tag),
    budget,
    // merchant: Object.values(merchant),
    // reminder: Object.values(reminder),
    // reminderMarker: Object.values(reminderMarker),
  }
}

export const getChangedNum = state => {
  const arrays = getChangedArrays(state)
  return Object.values(arrays).flat().length
}

export const getLastChangeTime = state => {
  const arrays = getChangedArrays(state)
  const lastUnix = Object.values(arrays)
    .flat()
    .reduce(
      (lastChange, item) =>
        item.changed > lastChange ? item.changed : lastChange,
      0
    )
  return new Date(lastUnix * 1000)
}
