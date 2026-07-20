import { fromGraph, graph } from './graph'
export { setBudget as set, type TBudgetUpdate } from './commands'
export { selectBudgetSlice as selectRaw } from './state'

export const selectAll = fromGraph(graph.budgets)
