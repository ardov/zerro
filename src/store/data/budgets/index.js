import selectors from './selectors'
import slice from './slice'

// REDUCER
export default slice.reducer

// ACTIONS
export const { setBudget } = slice.actions

// SELECTORS
export const {
  getBudgetsToSync,
  getBudgetsByMonthAndTag,
  getBudget,
  getGoals,
} = selectors
