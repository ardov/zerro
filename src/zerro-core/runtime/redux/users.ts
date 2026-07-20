import { createSelector } from '@reduxjs/toolkit'
import { useAppSelector } from 'store'
import { fromGraph, graph } from './graph'
import {
  getRootUserId,
  getUserInstrumentId,
} from '../../internal/domain/zenmoney/entities/users'
import { selectInstrumentSlice, selectUserSlice } from './state'

const selectRootId = createSelector(
  [selectUserSlice, selectInstrumentSlice],
  user => getRootUserId({ user })
)
const selectInstrumentId = createSelector(
  [selectUserSlice, selectInstrumentSlice],
  user => getUserInstrumentId({ user })
)
export const selectCurrency = fromGraph(graph.userCurrency)
export const useRootId = () => useAppSelector(selectRootId)
export const useCurrency = () => useAppSelector(selectCurrency)
export const useInstrumentId = () => useAppSelector(selectInstrumentId)
