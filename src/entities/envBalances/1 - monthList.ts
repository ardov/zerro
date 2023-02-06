import { createSelector } from '@reduxjs/toolkit'
import { TISOMonth } from '@shared/types'
import { nextMonth, toISOMonth } from '@shared/helpers/date'
import { keys } from '@shared/helpers/keys'

import { TSelector } from '@store'
import { trModel } from '@entities/transaction'
import { budgetModel } from '@entities/budget'

/**
 * Returns the date of first month as ISO.
 * To have correct result we should include all transactions
 * in our calculations. Otherwise calculated balance will be wrong.
 */
const getFirstMonth: TSelector<TISOMonth> = createSelector(
  [trModel.getTransactionsHistory],
  transactions => toISOMonth(transactions[0]?.date || Date.now())
)

/** Returns the last available month to budget. */
const getLastMonth: TSelector<TISOMonth> = createSelector(
  [budgetModel.get],
  budgets => {
    const currentMonth = toISOMonth(Date.now())
    const lastBudgetMonth = keys(budgets).sort().pop() || currentMonth
    const lastMonth =
      lastBudgetMonth > currentMonth ? lastBudgetMonth : currentMonth
    // 1 month added to be able to budget in future
    return toISOMonth(nextMonth(lastMonth))
  }
)

export const getMonthList: TSelector<TISOMonth[]> = createSelector(
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
