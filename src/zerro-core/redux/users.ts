import { createSelector } from '@reduxjs/toolkit'
import { useAppSelector } from 'store'
import type { RootState } from 'store'
import { graph } from './graph'
import { getRootUserId, getUserInstrumentId } from '../domain/zenmoney'
import { selectInstrumentSlice, selectUserSlice } from './state'

const selectRootId = createSelector(
  [selectUserSlice, selectInstrumentSlice],
  (user, instrument) => getRootUserId({ user, instrument })
)
const selectInstrumentId = createSelector(
  [selectUserSlice, selectInstrumentSlice],
  (user, instrument) => getUserInstrumentId({ user, instrument })
)
export const selectCurrency = (state: RootState) =>
  graph.userCurrency(state.data.current)
export const useRootId = () => useAppSelector(selectRootId)
export const useCurrency = () => useAppSelector(selectCurrency)
export const useInstrumentId = () => useAppSelector(selectInstrumentId)
