import { createSelector } from 'redux-starter-kit'
import { format } from 'date-fns'
import { convertToSyncArray } from 'helpers/converters'
import { goalTypes, goalDates } from './constants'

const getBudgets = createSelector(
  ['data.budget.server', 'data.budget.diff'],
  (serverBudgets, diffBudgets) => ({ ...serverBudgets, ...diffBudgets })
)

const getBudget = (state, tag, month) =>
  getBudgets(state)[`${tag},${format(month, 'yyyy-MM-dd')}`]

const getBudgetsToSave = createSelector(['data.budget.server'], budgets =>
  convertToSyncArray(budgets)
)

const getBudgetsToSync = state => convertToSyncArray(state.data.budget.diff)

const getBudgetsByMonthAndTag = createSelector([getBudgets], budgets => {
  return Object.values(budgets)
    .filter(
      budget =>
        budget.date !== goalDates.type &&
        budget.date !== goalDates.amount &&
        budget.date !== goalDates.date
    )
    .reduce((result, budget) => {
      const { date, tag } = budget
      if (!result[date]) result[date] = {}
      result[date][tag] = budget
      return result
    }, {})
})

const getGoals = createSelector([getBudgets], budgets => {
  const goalsByTag = {}
  const budgetArr = Object.values(budgets)

  // Parse goal types first
  budgetArr
    .filter(budget => budget.date === goalDates.type)
    .forEach(budget => {
      const { tag, outcome } = budget
      goalsByTag[tag] = { type: goalTypes[outcome] }
    })

  // Parse amounts
  budgetArr
    .filter(budget => budget.date === goalDates.amount)
    .forEach(budget => {
      const { tag, outcome } = budget
      if (goalsByTag[tag]) goalsByTag[tag].amount = outcome
    })

  // Parse dates
  budgetArr
    .filter(budget => budget.date === goalDates.date)
    .forEach(budget => {
      const { tag, outcome } = budget
      if (goalsByTag[tag]) goalsByTag[tag].date = outcome
    })

  console.log('goalsByTag', goalsByTag)

  return goalsByTag
})

export default {
  getBudgetsToSave,
  getBudgetsToSync,
  getBudgetsByMonthAndTag,
  getBudget,
  getGoals,
}
