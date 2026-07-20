import { fromGraph, graph } from './graph'
import * as monthList from './monthList'

export const selectList = monthList.selectList
export const selectTotals = fromGraph(graph.monthTotals)
