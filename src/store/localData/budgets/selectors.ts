import { createSelector } from '@reduxjs/toolkit'
import { convertToSyncArray } from 'helpers/converters'
import { formatDate } from 'helpers/format'
import { RootState } from 'store'
import { Budget, TagId } from 'types'

// Goal data was hidden in budgets for this date
export const goalBudgetDate = +new Date(2000, 0)

const getServerBudgets = (state: RootState) => state.serverData.budget
const getChangedBudgets = (state: RootState) => state.localData.budget

const getBudgets = createSelector(
  [getServerBudgets, getChangedBudgets],
  (serverBudgets, changedBudgets) => ({ ...serverBudgets, ...changedBudgets })
)

const getBudget = (state: RootState, tag: TagId, month: Date | number) =>
  getBudgets(state)[`${tag},${formatDate(month, 'yyyy-MM-dd')}`]

const getBudgetsToSync = (state: RootState) =>
  convertToSyncArray(getChangedBudgets(state))

const getBudgetsByMonthAndTag = createSelector([getBudgets], budgets => {
  let result = {} as {
    [month: number]: {
      [tagId: string]: Budget
    }
  }
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
  getBudgetsToSync,
  getBudgetsByMonthAndTag,
  getBudget,
}
