import { createSelector } from '@reduxjs/toolkit'
import isSameMonth from 'date-fns/isSameMonth'
import addMonths from 'date-fns/addMonths'
import { getTransactionsHistory } from 'models/transactions'
import { TISOMonth, TSelector } from 'shared/types'
import { toISOMonth } from 'shared/helpers/date'
import { getBudgets, getISOMonthFromBudgetId } from 'models/budgets'
import { keys } from 'shared/helpers/keys'

/** Returns the date of first month in ms.
 *  To have correct result we should include all transactions
 *  in our calculations. Otherwise calculated balance will be wrong.
 */
const getFirstMonth: TSelector<TISOMonth> = createSelector(
  [getTransactionsHistory],
  transactions => toISOMonth(transactions[0]?.date || Date.now())
)

/** Returns the last available month to budget. */
const getLastMonth: TSelector<TISOMonth> = createSelector(
  [getBudgets],
  budgets => {
    const currentMonth = toISOMonth(Date.now())
    const lastBudgetId = keys(budgets).sort().pop()
    const lastBudgetMonth = lastBudgetId
      ? getISOMonthFromBudgetId(lastBudgetId)
      : currentMonth
    const lastMonth =
      lastBudgetMonth > currentMonth ? lastBudgetMonth : currentMonth
    // Add 1 month to be able to budget in future
    const nextMonth = addMonths(new Date(lastMonth), 1)
    return toISOMonth(nextMonth)
  }
)

export const getMonthDates: TSelector<TISOMonth[]> = createSelector(
  [getFirstMonth, getLastMonth],
  (firstMs, lastMs) => {
    const firstDate = new Date(firstMs)
    const lastDate = new Date(lastMs)
    const result: TISOMonth[] = []
    let current = new Date(firstDate.getFullYear(), firstDate.getMonth() - 1, 1)
    do {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      result.push(toISOMonth(current))
    } while (!isSameMonth(current, lastDate))
    return result
  }
)
