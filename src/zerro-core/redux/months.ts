import { fromGraph, graph } from './graph'

export const selectList = fromGraph(graph.monthList)
export const selectTotals = fromGraph(graph.monthTotals)
