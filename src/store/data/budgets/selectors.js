import { createSelector } from 'redux-starter-kit'
import { format } from 'date-fns'
import { convertToSyncArray } from 'helpers/converters'

const getBudgets = createSelector(
  ['data.budget.server', 'data.budget.diff'],
  (serverBudgets, diffBudgets) => ({ ...serverBudgets, ...diffBudgets })
)

const getBudget = (state, tag, month) =>
  getBudgets(state)[`${tag},${format(month, 'YYYY-MM-DD')}`]

const getBudgetsToSave = createSelector(
  ['data.budget.server'],
  budgets => convertToSyncArray(budgets)
)

const getBudgetsToSync = state => convertToSyncArray(state.data.budget.diff)

const getBudgetsByMonthAndTag = createSelector(
  [getBudgets],
  budgets => {
    const result = {}
    for (const id in budgets) {
      const budget = budgets[id]
      const { date, tag } = budget
      if (!result[date]) {
        result[date] = {}
      }
      result[date][tag] = budget
    }
    return result
  }
)

export default {
  getBudgetsToSave,
  getBudgetsToSync,
  getBudgetsByMonthAndTag,
  getBudget,
}
