import startOfMonth from 'date-fns/start_of_month'
import isSameMonth from 'date-fns/is_same_month'
import createSelector from 'selectorator'
import { getTransactionsInBudget } from './baseSelectors'
import { getBudgetsByMonthAndTag } from 'store/data/budgets'

const getFirstMonth = createSelector(
  [getTransactionsInBudget],
  transactions => {
    console.log('Tr in budget:', transactions.length)

    if (transactions && transactions.length) {
      return +startOfMonth(transactions.sort((a, b) => a.date - b.date)[0].date)
    } else {
      return +startOfMonth(new Date())
    }
  }
)

const getLastMonth = createSelector(
  [getBudgetsByMonthAndTag],
  budgets => {
    const lastBudget = Object.keys(budgets)
      .map(s => parseInt(s))
      .sort((a, b) => a - b)
      .pop()

    const nextMonth = +new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    )
    return lastBudget > nextMonth ? lastBudget : nextMonth
  }
)

const getMonthDates = createSelector(
  [getFirstMonth, getLastMonth],
  (firstMs, lastMs) => {
    const firstDate = new Date(firstMs)
    const lastDate = new Date(lastMs)
    const result = []
    let current = new Date(firstDate.getFullYear(), firstDate.getMonth() - 1, 1)
    do {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      result.push(+current)
    } while (!isSameMonth(current, lastDate))
    return result
  }
)

export default getMonthDates
