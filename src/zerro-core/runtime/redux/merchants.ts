import type { RootState } from '@/store'
import { useAppSelector } from '@/store'
import { fromGraph, graph } from './graph'
import { selectData } from './state'

export const selectAll = (state: RootState) => selectData(state).merchant
export const useAll = () => useAppSelector(selectAll)

export const selectUsage = fromGraph(graph.merchantUsage)
export const useUsage = () => useAppSelector(selectUsage)

export { normalizePayee } from '../../internal/domain/zenmoney/entities/merchants'
export { findWebsiteDomain } from '../../internal/domain/zenmoney/read-models/merchantUsage'
