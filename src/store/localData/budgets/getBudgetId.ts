import { formatDate } from 'helpers/format'
import { Budget, ZmBudget } from 'types'

export function getBudgetId(budget: ZmBudget | Budget) {
  return `${budget.tag},${
    typeof budget.date === 'string'
      ? budget.date
      : formatDate(budget.date, 'yyyy-MM-dd')
  }`
}
