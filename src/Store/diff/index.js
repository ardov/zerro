import { combineReducers } from 'redux-starter-kit'
import transaction from './transaction'
import budget from './budget'
// import createSelector from 'selectorator'

// REDUCER
export default combineReducers({ transaction, budget })

// SELECTOR
export const getChangedArrays = state => {
  const {
    transaction,
    // account,
    // tag,
    budget,
    // merchant,
    // reminder,
    // reminderMarker,
  } = state.diff
  return {
    transaction: Object.values(transaction),
    // account: Object.values(account),
    // tag: Object.values(tag),
    budget: Object.values(budget),
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
