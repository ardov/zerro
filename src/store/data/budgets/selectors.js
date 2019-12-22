import { createSelector } from 'redux-starter-kit'
import { format } from 'date-fns'
import { convertToSyncArray } from 'helpers/converters'
import { goalBudgetDate } from './constants'
import { parseGoal } from './helpers'

const getBudgets = createSelector(
  ['data.serverData.budget', 'data.budget'],
  (serverBudgets, diffBudgets) => ({ ...serverBudgets, ...diffBudgets })
)

const getBudget = (state, tag, month) =>
  getBudgets(state)[`${tag},${format(month, 'yyyy-MM-dd')}`]

const getBudgetsToSync = state => convertToSyncArray(state.data.budget)

const getBudgetsByMonthAndTag = createSelector([getBudgets], budgets =>
  Object.values(budgets)
    .filter(budget => budget.date !== goalBudgetDate && budget.outcome)
    .reduce((result, budget) => {
      const { date, tag } = budget
      if (!result[date]) result[date] = {}
      result[date][tag] = budget
      return result
    }, {})
)

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
