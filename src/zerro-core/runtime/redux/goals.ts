export { setGoal as set } from './commands'
import { fromGraph, graph } from './graph'

export const selectRawGoals = fromGraph(graph.rawGoals)
export const selectAll = fromGraph(graph.goals)
export const selectTotals = fromGraph(graph.goalTotals)
export { formatGoal } from './goalPresentation'
export {
  goalType,
  type TGoal,
  type TGoalInfo,
} from '../../internal/domain/zerro'
