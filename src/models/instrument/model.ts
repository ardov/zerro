import { createSelector } from '@reduxjs/toolkit'
import {
  TFxIdMap,
  TInstrument,
  TInstrumentId,
  TZmInstrument,
} from 'shared/types'
import { RootState } from 'models'
import { getUserInstrumentId } from 'models/user'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertInstrument = {
  toClient: (el: TZmInstrument): TInstrument => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: TInstrument): TZmInstrument => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

export const getInstruments = (state: RootState) =>
  state.data.current.instrument

export const getUserInstrument = (state: RootState) => {
  const id = getUserInstrumentId(state)
  return id ? getInstruments(state)[id] : null
}

export const getUserCurrencyCode = (state: RootState) => {
  return getUserInstrument(state)?.shortTitle || 'RUB'
}

export const getFxIdMap = createSelector([getInstruments], instruments => {
  const fxIdMap: TFxIdMap = {}
  Object.values(instruments).forEach(curr => {
    fxIdMap[curr.id] = curr.shortTitle
  })
  return fxIdMap
})

export const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) =>
    (amount = 0, from: TInstrumentId | string, to?: TInstrumentId | string) => {
      to = to || userInstrument
      if (!to) return amount
      return amount * (instruments[from].rate / instruments[to].rate)
    }
)
