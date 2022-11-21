import { createSelector } from '@reduxjs/toolkit'
import { TInstrument, TFxCode, TInstrumentId } from '@shared/types'
import { RootState, TSelector, useAppSelector } from '@store'

const getInstruments = (state: RootState) => state.data.current.instrument

const getInstrumentsByCode: TSelector<Record<TFxCode, TInstrument>> =
  createSelector([getInstruments], instruments => {
    const result: Record<TFxCode, TInstrument> = {}
    Object.values(instruments).forEach(instrument => {
      result[instrument.shortTitle] = instrument
    })
    return result
  })

export type TInstCodeMap = Record<TInstrumentId, TFxCode>

const getInstCodeMap: TSelector<Record<TInstrumentId, TFxCode>> =
  createSelector([getInstruments], instruments => {
    const fxIdMap: TInstCodeMap = {}
    Object.values(instruments).forEach(curr => {
      fxIdMap[curr.id] = curr.shortTitle
    })
    return fxIdMap
  })

export const instrumentModel = {
  getInstruments,
  getInstrumentsByCode,
  getInstCodeMap,
  // Hooks
  useInstruments: () => useAppSelector(getInstruments),
  useInstrumentsByCode: () => useAppSelector(getInstrumentsByCode),
}
