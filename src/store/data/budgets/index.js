import selectors from './selectors'
import slice from './slice'
// import thunks from './thunks'

// REDUCER
export default slice.reducer

// ACTIONS
export const { setBudget } = slice.actions

// SELECTORS
export const {
  getBudgetsToSave,
  getBudgetsToSync,
  getBudgetsByMonthAndTag,
  getBudget,
} = selectors

// THUNKS
// export const { setOutcomeBudget } = thunks
