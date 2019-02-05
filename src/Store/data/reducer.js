import { createReducer } from 'redux-starter-kit'
import * as actions from './actions'
import keyBy from 'lodash/keyBy'

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

const dataReducer = createReducer(initialState, {
  [actions.wipeData]: (state, action) => initialState,

  [actions.setData]: (state, action) => ({
    ...initialState,
    ...action.payload
  }),

  [actions.updateData]: (state, action) => {
    const data = action.payload
    let newState = {
      lastSync: data.serverTimestamp
    }

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

export default dataReducer
