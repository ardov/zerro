import type { RootState } from '@/store'
import { fromGraph, graph } from './graph'
import { selectData } from './state'
export { setBudget as set, type TBudgetUpdate } from './commands'

export const selectRaw = (state: RootState) => selectData(state).budget

export const selectAll = fromGraph(graph.budgets)
