import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'store'
import { useAppSelector } from 'store'
import {
  getInstruments,
  getInstrumentsByCode,
  getInstCodeMap,
} from '../domain/zenmoney'
import { selectInstrumentSlice } from './state'

export const selectAll = (state: RootState) =>
  getInstruments({ instrument: selectInstrumentSlice(state) })
export const selectCodeMap = createSelector(
  [selectInstrumentSlice],
  instrument => getInstCodeMap({ instrument })
)
export const selectByCode = createSelector(
  [selectInstrumentSlice],
  instrument => getInstrumentsByCode({ instrument })
)
export const useAll = () => useAppSelector(selectAll)
export const useByCode = () => useAppSelector(selectByCode)
export const useCodeMap = () => useAppSelector(selectCodeMap)
export type { TInstrumentCodeMap } from '../domain/zenmoney'
