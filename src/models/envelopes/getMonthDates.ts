import { createSelector } from '@reduxjs/toolkit'
import { TISOMonth } from 'shared/types'
import { nextMonth, toISOMonth } from 'shared/helpers/date'
import { keys } from 'shared/helpers/keys'
import { getTransactionsHistory } from 'models/transaction'
import { getBudgets, getISOMonthFromBudgetId } from 'models/budget'
import { TSelector } from 'models'

/**
 * Returns the date of first month as ISO.
 * To have correct result we should include all transactions
 * in our calculations. Otherwise calculated balance will be wrong.
 */
const getFirstMonth: TSelector<TISOMonth> = createSelector(
  [getTransactionsHistory],
  transactions => toISOMonth(transactions[0]?.date || Date.now())
)

/**
 * Returns the last available month to budget.
 */
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
    return toISOMonth(nextMonth(lastMonth))
  }
)

export const getMonthDates: TSelector<TISOMonth[]> = createSelector(
  [getFirstMonth, getLastMonth],
  (start, end) => {
    const result: TISOMonth[] = []
    let current: TISOMonth = start
    do {
      result.push(current)
      current = toISOMonth(nextMonth(current))
    } while (current <= end)
    return result
  }
)
