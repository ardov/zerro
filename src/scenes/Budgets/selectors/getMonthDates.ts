import addMonths from 'date-fns/addMonths'
import { createSelector } from '@reduxjs/toolkit'
import { getTransactionsInBudget } from './baseSelectors'
import { getBudgetsByMonthAndTag } from 'store/localData/budgets'
import { withPerf } from 'helpers/performance'
import { makeDateArray, monthStart } from 'helpers/dateHelpers'

const getFirstMonth = createSelector(
  [getTransactionsInBudget],
  transactions =>
    +monthStart(
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
    return makeDateArray(firstMs, lastMs).map(d => +d)
  })
)

export default getMonthDates
