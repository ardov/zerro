import type { RootState } from 'store'
import { useAppSelector } from 'store'
import { selectData } from './state'

export const selectAll = (state: RootState) => selectData(state).merchant
export const useAll = () => useAppSelector(selectAll)
