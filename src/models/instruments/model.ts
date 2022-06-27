import { createSelector } from '@reduxjs/toolkit'
import { TInstrumentId } from 'shared/types'
import { RootState } from 'models'
import { getUserInstrumentId } from 'models/users'

export const getInstruments = (state: RootState) =>
  state.data.current.instrument

export const getUserInstrument = (state: RootState) => {
  const id = getUserInstrumentId(state)
  return id ? getInstruments(state)[id] : null
}

export const getUserCurrencyCode = (state: RootState) => {
  return getUserInstrument(state)?.shortTitle || 'RUB'
}

export const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) =>
    (amount = 0, from: TInstrumentId | string, to?: TInstrumentId | string) => {
      to = to || userInstrument
      if (!to) return amount
      return amount * (instruments[from].rate / instruments[to].rate)
    }
)
