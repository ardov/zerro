import { getBudgets } from './getBudgets'
import { setBudget } from './setBudget'

export type { TBudgetUpdate } from './setBudget'
export type { TTagBudgetUpdate } from './tagBudget'
export type { TEnvBudgetUpdate } from './envBudget'

export { getTagBudgets, setTagBudget } from './tagBudget'
export { getEnvBudgets, setEnvBudget } from './envBudget'

export const budgetModel = {
  get: getBudgets,
  set: setBudget,
}
