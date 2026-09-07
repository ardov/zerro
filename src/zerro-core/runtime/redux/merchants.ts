import type { RootState } from '@/store'
import { useAppSelector } from '@/store'
import { fromGraph, graph } from './graph'
import { selectData } from './state'

export const selectAll = (state: RootState) => selectData(state).merchant
export const useAll = () => useAppSelector(selectAll)

export const selectUsage = fromGraph(graph.merchantUsage)
export const useUsage = () => useAppSelector(selectUsage)
