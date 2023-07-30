import { createSelector } from '@reduxjs/toolkit'
import { TInstrument, TFxCode, TInstrumentId } from '6-shared/types'
import { RootState, TSelector } from 'store'

export const getInstruments = (state: RootState) =>
  state.data.current.instrument

export const getInstrumentsByCode: TSelector<Record<TFxCode, TInstrument>> =
  createSelector([getInstruments], instruments => {
    const result: Record<TFxCode, TInstrument> = {}
    Object.values(instruments).forEach(instrument => {
      result[instrument.shortTitle] = instrument
    })
    return result
  })

export type TInstCodeMap = Record<TInstrumentId, TFxCode>

export const getInstCodeMap: TSelector<Record<TInstrumentId, TFxCode>> =
  createSelector([getInstruments], instruments => {
    const fxIdMap: TInstCodeMap = {}
    Object.values(instruments).forEach(curr => {
      fxIdMap[curr.id] = curr.shortTitle
    })
    return fxIdMap
  })
