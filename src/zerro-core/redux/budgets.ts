import type { RootState } from 'store'
import { graph } from './graph'
export { setBudget as set, type TBudgetUpdate } from './commands'

export const selectAll = (state: RootState) => graph.budgets(state.data.current)
