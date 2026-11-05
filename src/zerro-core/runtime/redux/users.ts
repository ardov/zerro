import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import { useAppSelector } from '@/store'
import { fromGraph, graph } from './graph'
import {
  getRootUserId,
  getUserInstrumentId,
} from '../../internal/domain/zenmoney/entities/users'
import { selectData } from './state'

export const selectAll = (state: RootState) => selectData(state).user
const selectRootId = createSelector([selectAll], getRootUserId)
const selectInstrumentId = createSelector([selectAll], getUserInstrumentId)
export const selectCurrency = fromGraph(graph.userCurrency)
export const useRootId = () => useAppSelector(selectRootId)
export const useCurrency = () => useAppSelector(selectCurrency)
export const useInstrumentId = () => useAppSelector(selectInstrumentId)
