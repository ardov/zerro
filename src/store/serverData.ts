import { createSlice, createSelector } from '@reduxjs/toolkit'
import { wipeData, updateData } from 'store/commonActions'
import {
  convertDatesToMs,
  convertDatesToServerFormat,
} from 'helpers/converters'
import { RootState } from 'store'
import {
  Account,
  Budget,
  Company,
  Country,
  Instrument,
  InstrumentId,
  Merchant,
  Reminder,
  ReminderMarkerId,
  Tag,
  Transaction,
  User,
  ZmDeletionObject,
} from 'types'

function keys<O>(o: O) {
  return Object.keys(o) as (keyof O)[]
}

interface ServerData {
  serverTimestamp: number
  instrument: { [key: number]: Instrument }
  user: { [key: number]: User }
  merchant: { [key: string]: Merchant }
  country: { [key: number]: Country }
  company: { [key: number]: Company }
  reminder: { [key: string]: Reminder }
  reminderMarker: { [key: string]: ReminderMarkerId }
  account: { [key: string]: Account }
  tag: { [key: string]: Tag }
  budget: { [key: string]: Budget }
  transaction: { [key: string]: Transaction }
}

interface DataToSave {
  serverTimestamp: number
  instrument?: Instrument[]
  user?: User[]
  merchant?: Merchant[]
  country?: Country[]
  company?: Company[]
  reminder?: Reminder[]
  reminderMarker?: ReminderMarkerId[]
  account?: Account[]
  tag?: Tag[]
  budget?: Budget[]
  transaction?: Transaction[]
}

// INITIAL STATE
const initialState: ServerData = {
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
  name: 'serverData',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(wipeData, () => initialState)
      .addCase(updateData, (state, action) => {
        const { data } = action.payload
        if (!data) return state

        keys(data).forEach(key => {
          if (!data[key]) return

          if (key === 'serverTimestamp') {
            state[key] = data[key] * 1000
            return
          }

          if (key === 'budget') {
            data[key]?.forEach(budget => {
              state[key][`${budget.tag},${budget.date}`] = convertDatesToMs(
                budget
              )
            })
            return
          }

          if (key === 'deletion') {
            data[key]?.forEach(({ object, id }: ZmDeletionObject) => {
              // @ts-ignore
              delete state[object][id]
            })
            return
          }

          // @ts-ignore
          for (const item of data[key]) {
            // @ts-ignore
            state[key][item.id] = convertDatesToMs(item)
          }
        })
      })
  },
})

// REDUCER
export default reducer

/*
 *  SELECTORS
 */
export const getDataToSave = (state: RootState) => {
  const { serverData } = state
  let result: DataToSave = { serverTimestamp: 0 }
  keys(serverData).forEach(key => {
    if (key === 'serverTimestamp') {
      result[key] = +serverData[key] / 1000
    } else {
      result[key] = Object.values(serverData[key]).map(item =>
        convertDatesToServerFormat(item)
      )
    }
  })
  return result
}

// SYNC TIME
export const getLastSyncTime = (state: RootState) =>
  state.serverData.serverTimestamp

// USERS
export const getUsers = (state: RootState) => state.serverData.user

export const getRootUser = (state: RootState) => {
  const users = getUsers(state)
  return Object.values(users).find(user => !user.parent) || null
}

export const getRootUserId = (state: RootState) => getRootUser(state)?.id
export const getUserInstrumentId = (state: RootState) =>
  getRootUser(state)?.currency

// INSTRUMENTS
export const getInstruments = (state: RootState) => state.serverData.instrument
export const getInstrument = (state: RootState, id: number) =>
  getInstruments(state)[id]

export const getUserInstrument = (state: RootState) => {
  const id = getUserInstrumentId(state)
  return id ? getInstrument(state, id) : null
}

export const getUserCurrencyCode = (state: RootState) =>
  getUserInstrument(state)?.shortTitle || 'RUB'

export const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) => (
    amount = 0,
    from: InstrumentId,
    to?: InstrumentId
  ) => {
    to = to || userInstrument
    if (!to) return undefined
    return (amount * instruments[from].rate) / instruments[to].rate
  }
)
