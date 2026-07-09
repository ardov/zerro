import { getGoals } from './getGoals'
import { getTotals } from './getTotals'
import { getRawGoals } from './goalStore'
import { goalToWords } from './shared/helpers'
import { setGoal } from './setGoal'

export type { TGoal } from './shared/types'
export type { TGoals } from './goalStore'
export type { TGoalInfo } from './getGoals'

export { goalType } from './shared/types'

export const goalModel = {
  // Selectors. Reads are migrated to Core Next; these stay as the reference
  // implementation for parity tests and for the not-yet-migrated write thunks.
  /** @deprecated Read via `selectCoreGoals` from `core-next/adapters/redux` */
  get: getGoals,
  /** @deprecated Read via `selectCoreGoalTotals` from `core-next/adapters/redux` */
  getTotals: getTotals,
  getRaw: getRawGoals,

  // Thunks
  set: setGoal,

  // Helpers
  toWords: goalToWords,
}
