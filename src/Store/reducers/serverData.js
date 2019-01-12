import * as types from '../actionTypes'
import parseData from './parseData'
import LocalStorage from '../../services/localstorage'

const defaultState = {
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

export default function serverData(state = defaultState, action = {}) {
  const { type, payload } = action

  switch (type) {
    case types.MERGE_SERVER_DATA:
      const newState = parseData(state, payload)
      LocalStorage.set('data', {
        lastSync: newState.lastSync,
        instrument: newState.instrument,
        country: newState.country,
        company: newState.company,
        user: newState.user,
        account: newState.account,
        tag: newState.tag,
        // budget: newState.budget,
        merchant: newState.merchant,
        reminder: newState.reminder,
        reminderMarker: newState.reminderMarker,
        transaction: newState.transaction
      })
      return newState

    case types.SET_LOCAL_STATE:
      return payload

    default:
      return state
  }
}
