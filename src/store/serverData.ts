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
  ById,
  Company,
  Country,
  Instrument,
  InstrumentId,
  LocalData,
  Merchant,
  Reminder,
  ReminderMarkerId,
  Tag,
  Transaction,
  User,
  ZmDeletionObject,
} from 'types'
import { withPerf } from 'helpers/performance'
import { keys } from 'helpers/keys'
import { getBudgetId } from './localData/budgets/getBudgetId'

interface ServerData {
  serverTimestamp: number
  instrument: ById<Instrument>
  user: ById<User>
  merchant: ById<Merchant>
  country: ById<Country>
  company: ById<Company>
  reminder: ById<Reminder>
  reminderMarker: ById<ReminderMarkerId>
  account: ById<Account>
  tag: ById<Tag>
  budget: ById<Budget>
  transaction: ById<Transaction>
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
      .addCase(
        updateData,
        withPerf('updateData', (state, action) => {
          const { data } = action.payload
          if (!data) return state

          keys(data).forEach(key => {
            if (data[key] === undefined) return

            if (key === 'serverTimestamp') {
              state[key] = data[key] || 0
              return
            }

            if (key === 'budget') {
              data[key]?.forEach(budget => {
                const id = getBudgetId(budget)
                state[key][id] = budget
              })
              return
            }

            if (key === 'deletion') {
              data[key]?.forEach(({ object, id }: ZmDeletionObject) => {
                delete state[object][id]
              })
              return
            }

            // @ts-ignore
            data[key]?.forEach(item => {
              state[key][item.id] = item
            })
          })
        })
      )
  },
})

// REDUCER
export default reducer

/*
 *  SELECTORS
 */
export const getDataToSave = (state: RootState) => {
  const { serverData } = state
  let result: LocalData = { serverTimestamp: 0 }
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
    if (!to) return amount
    return amount * (instruments[from].rate / instruments[to].rate)
  }
)

// MERCHANTS
export const getMerchants = (state: RootState) => state.serverData.merchant
