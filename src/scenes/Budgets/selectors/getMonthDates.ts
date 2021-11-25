import { createSelector } from '@reduxjs/toolkit'
import startOfMonth from 'date-fns/startOfMonth'
import isSameMonth from 'date-fns/isSameMonth'
import addMonths from 'date-fns/addMonths'
import { getBudgetsByMonthAndTag } from 'store/data/budgets'
import { getTransactionsHistory } from 'store/data/transactions'
import { Selector } from 'types'

/** Returns the date of first month in ms.
 *  To have correct result we should include all transactions
 *  in our calculations. Otherwise calculated balance will be wrong.
 */
const getFirstMonth: Selector<number> = createSelector(
  [getTransactionsHistory],
  transactions => {
    let firstDate = transactions[0]?.date
    firstDate ??= Date.now()
    return +startOfMonth(firstDate)
  }
)

/** Returns the last available month to budget. */
const getLastMonth: Selector<number> = createSelector(
  [getBudgetsByMonthAndTag],
  budgets => {
    const lastBudgetDate =
      Object.keys(budgets)
        .map(s => parseInt(s))
        .sort((a, b) => a - b)
        .pop() || 0
    const maxDate = Math.max(lastBudgetDate, Date.now())
    return +addMonths(startOfMonth(maxDate), 1)
  }
)

export const getMonthDates: Selector<number[]> = createSelector(
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
