import { createSelector } from '@reduxjs/toolkit'
import { useAppSelector } from 'store'
import {
  getRootUserId,
  getUserCurrency,
  getUserInstrumentId,
} from '../domain/zenmoney'
import { selectInstrumentSlice, selectUserSlice } from './state'

const selectRootId = createSelector(
  [selectUserSlice, selectInstrumentSlice],
  (user, instrument) => getRootUserId({ user, instrument })
)
const selectInstrumentId = createSelector(
  [selectUserSlice, selectInstrumentSlice],
  (user, instrument) => getUserInstrumentId({ user, instrument })
)
export const selectCurrency = createSelector(
  [selectUserSlice, selectInstrumentSlice],
  (user, instrument) => getUserCurrency({ user, instrument })
)
export const useRootId = () => useAppSelector(selectRootId)
export const useCurrency = () => useAppSelector(selectCurrency)
export const useInstrumentId = () => useAppSelector(selectInstrumentId)
