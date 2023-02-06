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
  // Selectors
  get: getGoals,
  getTotals: getTotals,
  getRaw: getRawGoals,

  // Hooks
  useGoals: () => useAppSelector(getGoals),
  useTotals: () => useAppSelector(getTotals),

  // Thunks
  set: setGoal,

  // Helpers
  toWords: goalToWords,
}
