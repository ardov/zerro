import { formatDate } from 'shared/helpers/format'
import { TBudget, TZmBudget } from 'types'

export function getBudgetId(budget: TZmBudget | TBudget) {
  return `${budget.tag},${formatDate(new Date(budget.date), 'yyyy-MM-dd')}`
}
