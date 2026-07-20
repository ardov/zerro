import { fromGraph, graph } from './graph'
export { setBudget as set, type TBudgetUpdate } from './commands'

export const selectAll = fromGraph(graph.budgets)
