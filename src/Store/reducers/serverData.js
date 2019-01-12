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
        lastSync: state.lastSync,
        instrument: state.instrument,
        country: state.country,
        company: state.company,
        user: state.user,
        account: state.account,
        tag: state.tag,
        // budget: state.budget,
        merchant: state.merchant,
        reminder: state.reminder,
        reminderMarker: state.reminderMarker,
        transaction: state.transaction
      })
      return newState

    default:
      return state
  }
}
