import { formatDate } from 'helpers/format'
import { Budget, ZmBudget } from 'types'

export function getBudgetId(budget: ZmBudget | Budget) {
  return `${budget.tag},${formatDate(new Date(budget.date), 'yyyy-MM-dd')}`
}
