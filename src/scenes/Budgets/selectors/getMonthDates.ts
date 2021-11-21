import { createSelector } from '@reduxjs/toolkit'
import startOfMonth from 'date-fns/startOfMonth'
import isSameMonth from 'date-fns/isSameMonth'
import addMonths from 'date-fns/addMonths'
import { getBudgetsByMonthAndTag } from 'store/data/budgets'
import { getTransactionsHistory } from 'store/data/transactions'
import { Selector } from 'types'

const getFirstMonth: Selector<number> = createSelector(
  [getTransactionsHistory],
  transactions => {
    const START = +new Date(2010, 0, 1)
    for (const tr of transactions) {
      if (tr.date >= START) {
        return +startOfMonth(tr.date)
      }
    }
    return +startOfMonth(Date.now())
  }
)

const getLastMonth: Selector<number> = createSelector(
  [getBudgetsByMonthAndTag],
  budgets => {
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
