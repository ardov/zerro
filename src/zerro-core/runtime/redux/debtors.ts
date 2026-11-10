import { fromGraph, graph } from './graph'

export const selectAll = fromGraph(graph.debtors)
export const selectOptions = fromGraph(graph.debtorNames)
export { getDebtorId } from '../../internal/domain/zenmoney/read-models/debtors'
