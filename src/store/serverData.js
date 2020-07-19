import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData } from 'store/commonActions'
import {
  convertDatesToMs,
  convertDatesToServerFormat,
} from 'helpers/converters'

// INITIAL STATE
const initialState = {
  serverTimestamp: 0,
  instrument: {},
  user: {},
  merchant: {},
  country: {},
  company: {},
  reminder: {},
  reminderMarker: {},
  account: {},
  tag: {},
  budget: {},
  transaction: {},
}

// SLICE
const { reducer } = createSlice({
  slice: 'serverData',
  initialState,
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      const { data } = payload
      if (!data) return state

      for (const type in data) {
        if (!data[type]) continue
        switch (type) {
          case 'serverTimestamp':
            state[type] = data[type] * 1000
            break

          case 'budget':
            for (const item of data[type]) {
              state[type][`${item.tag},${item.date}`] = convertDatesToMs(item)
            }
            break

          case 'deletion':
            for (const item of data[type]) {
              delete state[item.object][item.id]
            }
            break

          default:
            for (const item of data[type]) {
              state[type][item.id] = convertDatesToMs(item)
            }
            break
        }
      }
    },
  },
})

// REDUCER
export default reducer

/*
 *  SELECTORS
 */
export const getDataToSave = state => {
  const data = state.serverData
  const result = {
    serverTimestamp: +data.serverTimestamp / 1000,
  }
  for (const key in data) {
    if (key !== 'serverTimestamp') {
      result[key] = Object.values(data[key]).map(item =>
        convertDatesToServerFormat(item)
      )
    }
  }
  return result
}

// SYNC TIME
export const getLastSyncTime = state => state.serverData.serverTimestamp

// USERS
export const getUsers = state => state.serverData.user

export const getRootUser = state => {
  const users = getUsers(state)
  return Object.values(users).find(user => !user.parent) || {}
}

export const getRootUserId = state => getRootUser(state).id
export const getUserInstrumentId = state => getRootUser(state).currency

// INSTRUMENTS
export const getInstruments = state => state.serverData.instrument
export const getInstrument = (state, id) => getInstruments(state)[id]

export const getUserInstrument = state =>
  getInstrument(state, getUserInstrumentId(state))

export const getUserCurrencyCode = state =>
  getUserInstrument(state)?.shortTitle || 'RUB'

export const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) => (amount = 0, from, to = userInstrument) => {
    return (amount * instruments[from].rate) / instruments[to].rate
  }
)
