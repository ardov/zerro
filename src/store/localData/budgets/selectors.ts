import { createSelector } from '@reduxjs/toolkit'
import { formatDate } from 'helpers/format'
import { RootState } from 'store'
import { convertCurrency } from 'store/data/selectors'
import { Budget, ById, TagId } from 'types'
import { getTagMeta } from '../hiddenData/selectors'

// Goal data was hidden in budgets for this date
const goalBudgetDate = +new Date(2000, 0)

const getBudgets = (state: RootState) => state.data.current.budget

const getBudget = (state: RootState, tag: TagId, month: Date | number) =>
  getBudgets(state)[`${tag},${formatDate(month, 'yyyy-MM-dd')}`]

const getPopulatedBudgets = createSelector(
  [getBudgets, getTagMeta, convertCurrency],
  (budgets, meta, convert) => {
    const entries = Object.entries(budgets).map(([id, budget]) => {
      const { tag, outcome } = budget
      const instrument = meta[tag || 'null']?.currency
      if (!instrument) return [id, budget]
      return [
        id,
        {
          ...budget,
          rawOutcome: outcome,
          instrument,
          outcome: convert(outcome, instrument),
        },
      ]
    })
    return Object.fromEntries(entries)
  }
)

const getBudgetsByMonthAndTag = createSelector(
  [getPopulatedBudgets],
  budgets => {
    let result: { [month: number]: ById<Budget> } = {}
    for (const key in budgets) {
      const { date, tag, outcome } = budgets[key]
      // skip old goals
      if (date !== goalBudgetDate && outcome) {
        if (!result[date]) result[date] = {}
        result[date][String(tag)] = budgets[key]
      }
    }
    return result
  }
)

export const selectors = {
  getBudgetsByMonthAndTag,
  getBudget,
}
