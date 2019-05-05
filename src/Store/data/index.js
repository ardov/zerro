import { createAction, createReducer } from 'redux-starter-kit'
import keyBy from 'lodash/keyBy'

//ACTIONS

export const updateData = createAction('data/update')
export const wipeData = createAction('data/wipe')
export const setData = createAction('data/set')

//REDUCER

const initialState = {
  lastSync: 0,
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

export default createReducer(initialState, {
  [wipeData]: (state, action) => initialState,

  [setData]: (state, action) => ({
    ...initialState,
    ...action.payload
  }),

  [updateData]: (state, action) => {
    const data = action.payload
    let newState = { lastSync: data.serverTimestamp }
    const types = [
      'instrument',
      'country',
      'company',
      'user',
      'account',
      'tag',
      // 'budget',
      'merchant',
      'reminder',
      'reminderMarker',
      'transaction'
    ]
    types.forEach(type => {
      if (data[type]) {
        newState[type] = {
          ...state[type],
          ...keyBy(data[type], el => el.id)
        }
      }
    })
    return { ...state, ...newState }
  }
})
