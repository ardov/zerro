import { createAction, createReducer } from 'redux-starter-kit'
import keyBy from 'lodash/keyBy'

// ACTIONS
export const updateData = createAction('data/update')
export const wipeData = createAction('data/wipe')

// INITIAL STATE
const initialState = {
  serverTimestamp: 0,
  instrument: {},
  country: {},
  company: {},
  user: {},
  account: {},
  tag: {},
  budget: {},
  merchant: {},
  reminder: {},
  reminderMarker: {},
  transaction: {}
}

// REDUCER
export default createReducer(initialState, {
  [wipeData]: (state, action) => initialState,

  [updateData]: (state, action) => {
    const data = action.payload
    let newState = { serverTimestamp: data.serverTimestamp }
    for (let type in state) {
      if (data[type] && Array.isArray(data[type])) {
        newState[type] = { ...state[type], ...keyBy(data[type], 'id') }
      }
    }
    return { ...state, ...newState }
  }
})
