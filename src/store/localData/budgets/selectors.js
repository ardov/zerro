import { createSelector } from 'redux-starter-kit'
import { format } from 'date-fns'
import { convertToSyncArray } from 'helpers/converters'

// Goal data was hidden in budgets for this date
export const goalBudgetDate = +new Date(2000, 0)

const getServerBudgets = state => state.serverData.budget
const getChangedBudgets = state => state.localData.budget

const getBudgets = createSelector(
  [getServerBudgets, getChangedBudgets],
  (serverBudgets, changedBudgets) => ({ ...serverBudgets, ...changedBudgets })
)

const getBudget = (state, tag, month) =>
  getBudgets(state)[`${tag},${format(month, 'yyyy-MM-dd')}`]

const getBudgetsToSync = state => convertToSyncArray(getChangedBudgets(state))

const getBudgetsByMonthAndTag = createSelector([getBudgets], budgets => {
  let result = {}
  for (const key in budgets) {
    const { date, tag, outcome } = budgets[key]
    // skip old goals
    if (date !== goalBudgetDate && outcome) {
      if (!result[date]) result[date] = {}
      result[date][tag] = budgets[key]
    }
  }
  return result
})

export default {
  getBudgetsToSync,
  getBudgetsByMonthAndTag,
  getBudget,
}
