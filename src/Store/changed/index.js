import { combineReducers } from 'redux-starter-kit'
import transaction from './transaction'
// import createSelector from 'selectorator'

// REDUCER
export default combineReducers({ transaction })

// SELECTOR
export const getChangedArrays = state => {
  const {
    transaction,
    // account,
    // tag,
    // budget,
    // merchant,
    // reminder,
    // reminderMarker,
  } = state.changed
  return {
    transaction: Object.values(transaction),
    // account: Object.values(account),
    // tag: Object.values(tag),
    // budget: Object.values(budget),
    // merchant: Object.values(merchant),
    // reminder: Object.values(reminder),
    // reminderMarker: Object.values(reminderMarker),
  }
}

export const getChangedNum = state => {
  const arrays = getChangedArrays(state)
  return Object.values(arrays).flat().length
}
