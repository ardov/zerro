export { setGoal as set } from './commands'
import type { RootState } from 'store'
import { graph } from './graph'

export const selectRawGoals = (state: RootState) =>
  graph.rawGoals(state.data.current)
export const selectAll = (state: RootState) => graph.goals(state.data.current)
export const selectTotals = (state: RootState) =>
  graph.goalTotals(state.data.current)
export { formatGoal } from './goalPresentation'
export { goalType, type TGoal, type TGoalInfo } from '../domain/zerro/goals'
