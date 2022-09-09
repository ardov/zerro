import { createSelector } from '@reduxjs/toolkit'
import { TInstrument, TFxCode, TInstrumentId } from '@shared/types'
import { RootState } from '@store'
import { getUserInstrumentId } from '@entities/user'
import { TFxIdMap } from './types'

export const getInstruments = (state: RootState) =>
  state.data.current.instrument

export const getUserInstrument = (state: RootState) => {
  const id = getUserInstrumentId(state)
  return id ? getInstruments(state)[id] : null
}

export const getUserCurrencyCode = (state: RootState) => {
  return getUserInstrument(state)?.shortTitle || 'RUB'
}

export const getInstrumentsByCode = createSelector(
  [getInstruments],
  instruments => {
    const result: Record<TFxCode, TInstrument> = {}
    Object.values(instruments).forEach(instrument => {
      result[instrument.shortTitle] = instrument
    })
    return result
  }
)

export const getFxIdMap = createSelector([getInstruments], instruments => {
  const fxIdMap: TFxIdMap = {}
  Object.values(instruments).forEach(curr => {
    fxIdMap[curr.id] = curr.shortTitle
  })
  return fxIdMap
})

export const getCurrentRates = createSelector([getInstruments], instruments => {
  return Object.values(instruments).reduce((rates, curr) => {
    rates[curr.shortTitle] = curr.rate
    return rates
  }, {} as Record<TFxCode, number>)
})

export const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) =>
    (amount = 0, from: TInstrumentId, to?: TInstrumentId) => {
      to = to || userInstrument
      if (!to) return amount
      return amount * (instruments[from].rate / instruments[to].rate)
    }
)
