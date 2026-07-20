import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from 'store'
import { useAppSelector } from 'store'
import { getInstrumentsByCode } from '../../internal/domain/zenmoney/entities/instruments'
import { fromGraph, graph } from './graph'
import { selectData } from './state'

export const selectAll = (state: RootState) => selectData(state).instrument
export const selectCodeMap = fromGraph(graph.instrumentCodeById)
export const selectByCode = createSelector([selectAll], instruments =>
  getInstrumentsByCode(instruments)
)
export const useAll = () => useAppSelector(selectAll)
export const useByCode = () => useAppSelector(selectByCode)
export const useCodeMap = () => useAppSelector(selectCodeMap)
export type { TInstrumentCodeMap } from '../../internal/domain/zenmoney/entities/instruments'
