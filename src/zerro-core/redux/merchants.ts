import type { RootState } from 'store'
import { useAppSelector } from 'store'
import { getMerchants } from '../domain/zenmoney'
import { selectMerchantSlice } from './state'

export const selectAll = (state: RootState) =>
  getMerchants({ merchant: selectMerchantSlice(state) })
export const useAll = () => useAppSelector(selectAll)
