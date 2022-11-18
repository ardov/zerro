import { useAppSelector } from '@store/index'
import { getGoals } from './getGoals'
import { getTotals } from './getTotals'
import { getRawGoals } from './goalStore'
import { goalToWords } from './shared/helpers'
import { setGoal } from './setGoal'

export type { TGoal } from './shared/types'
export type { TGoals } from './goalStore'
export type { GoalProgress } from './goalProgress'
export type { TGoalInfo } from './getGoals'

export { calculateGoalProgress } from './goalProgress'
export { goalType } from './shared/types'

export const goalModel = {
  get: getGoals,
  getTotals: getTotals,
  set: setGoal,
  toWords: goalToWords,
  getRaw: getRawGoals,
  // Hooks
  useGoals: () => useAppSelector(getGoals),
  useTotals: () => useAppSelector(getTotals),
}
