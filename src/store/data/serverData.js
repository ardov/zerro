import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData } from 'store/data/commonActions'
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
const { reducer, actions } = createSlice({
  slice: 'serverData',
  initialState,
  reducers: {
    updateData: (state, { payload }) => {
      if (!payload) return
      Object.keys(payload).forEach(key => {
        switch (key) {
          case 'serverTimestamp':
            state[key] = payload[key] * 1000
            break

          case 'budget':
            if (payload[key] && payload[key].forEach) {
              payload[key].forEach(item => {
                state[key][`${item.tag},${item.date}`] = convertDatesToMs(item)
              })
            }
            break

          case 'deletion':
            payload.deletion.forEach(item => delete state[item.object][item.id])
            break

          default:
            if (payload[key] && payload[key].forEach) {
              payload[key].forEach(item => {
                state[key][item.id] = convertDatesToMs(item)
              })
            }
            break
        }
      })
    },
  },
  extraReducers: {
    [wipeData]: () => initialState,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { updateData } = actions

/*
 *  SELECTORS
 */

export const getDataToSave = state => {
  const data = state.data.serverData
  const result = {
    serverTimestamp: data.serverTimestamp / 1000,
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
export const getLastSyncTime = state => state.data.serverData.serverTimestamp

// USERS
export const getUsers = state => state.data.serverData.user

export const getRootUser = state => {
  const users = getUsers(state)
  return Object.values(users).reduce(
    (res, user) => (!user.parent ? user : res),
    {}
  )
}

export const getUserInstrumentId = state => getRootUser(state).currency

// INSTRUMENTS
export const getInstruments = state => state.data.serverData.instrument
export const getInstrument = (state, id) => getInstruments(state)[id]

export const getUserInstrument = state =>
  getInstrument(state, getUserInstrumentId(state))

export const getUserCurrencyCode = state =>
  getUserInstrument(state) ? getUserInstrument(state).shortCode : 'RUB'

export const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) => (amount = 0, from, to = userInstrument) => {
    return (amount * instruments[from].rate) / instruments[to].rate
  }
)
