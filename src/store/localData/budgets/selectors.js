import { createSelector } from 'redux-starter-kit'
import { format } from 'date-fns'
import { convertToSyncArray } from 'helpers/converters'
import { goalBudgetDate } from './constants'
import { parseGoal } from './helpers'

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
    // skip goals
    if (date !== goalBudgetDate && outcome) {
      if (!result[date]) result[date] = {}
      result[date][tag] = budgets[key]
    }
  }
  return result
})

const getGoals = createSelector([getBudgets], budgets =>
  Object.values(budgets)
    .filter(budget => budget.date === goalBudgetDate)
    .reduce((goalsByTag, budget) => {
      goalsByTag[budget.tag] = parseGoal(budget)
      return goalsByTag
    }, {})
)

export default {
  getBudgetsToSync,
  getBudgetsByMonthAndTag,
  getBudget,
  getGoals,
}
