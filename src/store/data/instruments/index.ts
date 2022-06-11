import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { TInstrumentId } from 'types'
import { getRootUser } from '../users'

export const getInstruments = (state: RootState) =>
  state.data.current.instrument

export const getUserInstrumentId = (state: RootState) =>
  getRootUser(state)?.currency

export const getUserInstrument = (state: RootState) => {
  const id = getUserInstrumentId(state)
  return id ? getInstruments(state)[id] : null
}

export const getUserCurrencyCode = (state: RootState) =>
  getUserInstrument(state)?.shortTitle || 'RUB'

export const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) =>
    (amount = 0, from: TInstrumentId | string, to?: TInstrumentId | string) => {
      to = to || userInstrument
      if (!to) return amount
      return amount * (instruments[from].rate / instruments[to].rate)
    }
)
