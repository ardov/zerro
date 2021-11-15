import startOfMonth from 'date-fns/startOfMonth'
import isSameMonth from 'date-fns/isSameMonth'
import addMonths from 'date-fns/addMonths'
import { createSelector } from '@reduxjs/toolkit'
import { getTransactionsInBudget } from './baseSelectors'
import { getBudgetsByMonthAndTag } from 'store/data/budgets'
import { withPerf } from 'helpers/performance'

const getFirstMonth = createSelector(
  [getTransactionsInBudget],
  transactions =>
    +startOfMonth(
      transactions.length
        ? transactions[transactions.length - 1].date
        : Date.now()
    )
)

const getLastMonth = createSelector(
  [getBudgetsByMonthAndTag],
  withPerf('BUDGET: getLastMonth', budgets => {
    const lastBudgetDate = Object.keys(budgets)
      .map(s => parseInt(s))
      .sort((a, b) => a - b)
      .pop()

    const afterLastBudget = +addMonths(new Date(lastBudgetDate || 0), 1)

    const nextMonth = +new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1
    )

    return Math.max(afterLastBudget, nextMonth)
  })
)

const getMonthDates = createSelector(
  [getFirstMonth, getLastMonth],
  withPerf('BUDGET: getMonthDates', (firstMs, lastMs) => {
    const firstDate = new Date(firstMs)
    const lastDate = new Date(lastMs)
    const result = []
    let current = new Date(firstDate.getFullYear(), firstDate.getMonth() - 1, 1)
    do {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      result.push(+current)
    } while (!isSameMonth(current, lastDate))
    return result
  })
)

export default getMonthDates
