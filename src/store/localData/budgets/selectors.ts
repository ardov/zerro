import { createSelector } from '@reduxjs/toolkit'
import { formatDate } from 'helpers/format'
import { RootState } from 'store'
import { Budget, ById, TagId } from 'types'

// Goal data was hidden in budgets for this date
export const goalBudgetDate = +new Date(2000, 0)

const getBudgets = (state: RootState) => state.data.current.budget

const getBudget = (state: RootState, tag: TagId, month: Date | number) =>
  getBudgets(state)[`${tag},${formatDate(month, 'yyyy-MM-dd')}`]

const getBudgetsByMonthAndTag = createSelector([getBudgets], budgets => {
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
})

export const selectors = {
  getBudgetsByMonthAndTag,
  getBudget,
}
