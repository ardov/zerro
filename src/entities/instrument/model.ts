import { createSelector } from '@reduxjs/toolkit'
import { TInstrument, TFxCode, TInstrumentId } from '@shared/types'
import { RootState, useAppSelector } from '@store'
import { getUserInstrumentId } from '@entities/user'
import { TFxIdMap } from './types'

const getInstruments = (state: RootState) => state.data.current.instrument

const getInstrumentsByCode = createSelector([getInstruments], instruments => {
  const result: Record<TFxCode, TInstrument> = {}
  Object.values(instruments).forEach(instrument => {
    result[instrument.shortTitle] = instrument
  })
  return result
})

const getFxIdMap = createSelector([getInstruments], instruments => {
  const fxIdMap: TFxIdMap = {}
  Object.values(instruments).forEach(curr => {
    fxIdMap[curr.id] = curr.shortTitle
  })
  return fxIdMap
})

const convertCurrency = createSelector(
  [getInstruments, getUserInstrumentId],
  (instruments, userInstrument) =>
    (amount = 0, from: TInstrumentId, to?: TInstrumentId) => {
      to = to || userInstrument
      if (!to) return amount
      return amount * (instruments[from].rate / instruments[to].rate)
    }
)

export const instrumentModel = {
  getInstruments,
  getInstrumentsByCode,
  getFxIdMap,
  convertCurrency, // TODO: deprecated
  // Hooks
  useInstruments: () => useAppSelector(getInstruments),
  useInstrumentsByCode: () => useAppSelector(getInstrumentsByCode),
}
