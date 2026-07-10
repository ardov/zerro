import { getBudgets } from './getBudgets'
import { setBudget } from './setBudget'

export type { TBudgetUpdate } from './setBudget'
export type { TEnvBudgetUpdate } from './envBudget'

export { getTagBudgets } from './tagBudget'
export { getEnvBudgets, setEnvBudget } from './envBudget'

export const budgetModel = {
  // Reads are migrated to Core Next; `get` stays as the reference
  // implementation for parity tests and fixture exports.
  /** @deprecated Read via `selectCoreBudgets` from `core-next/adapters/redux` */
  get: getBudgets,
  set: setBudget,
}
