import { useAppSelector } from '@store/index'
import { getGoals } from './getGoals'
import { getRawGoals } from './goalStore'
import { goalToWords } from './helpers'
import { setGoal } from './setGoal'

export type { TGoal } from './types'
export type { TGoals } from './goalStore'
export type { GoalProgress } from './goalProgress'
export type { TGoalInfo } from './getGoals'

export { calculateGoalProgress } from './goalProgress'
export { goalType } from './types'

export const goalModel = {
  get: getGoals,
  set: setGoal,
  toWords: goalToWords,
  getRaw: getRawGoals,
  // Hooks
  useGoals: () => useAppSelector(getGoals),
}
