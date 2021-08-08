import { createSelector } from '@reduxjs/toolkit'
import { keys } from 'helpers/keys'
import { RootState } from 'store'
import { Diff, InstrumentId, LocalData } from 'types'
import { toServer } from 'worker/zmAdapter'

/*
 *  SELECTORS
 */
export const getDataToSave = (state: RootState): LocalData => {
  const data = state.data.server
  if (!data) return { serverTimestamp: 0 }
  let result: Diff = { serverTimestamp: 0 }
  keys(data).forEach(key => {
    if (key === 'serverTimestamp') {
      result[key] = data[key]
    } else {
      result[key] = Object.values(data[key])
    }
  })
  return toServer(result)
}

// SYNC TIME
export const getLastSyncTime = (state: RootState) =>
  state.data.current.serverTimestamp

// USERS
export const getUsers = (state: RootState) => state.data.current.user

export const getRootUser = (state: RootState) => {
  const users = getUsers(state)
  return Object.values(users).find(user => !user.parent) || null
}

export const getRootUserId = (state: RootState) => getRootUser(state)?.id
export const getUserInstrumentId = (state: RootState) =>
  getRootUser(state)?.currency

// INSTRUMENTS
export const getInstruments = (state: RootState) =>
  state.data.current.instrument
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
    from: InstrumentId | string,
    to?: InstrumentId | string
  ) => {
    to = to || userInstrument
    if (!to) return amount
    return amount * (instruments[from].rate / instruments[to].rate)
  }
)

// MERCHANTS
export const getMerchants = (state: RootState) => state.data.current.merchant
