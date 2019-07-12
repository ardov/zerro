import { createSlice } from 'redux-starter-kit'
// import { format } from 'date-fns'
// import ru from 'date-fns/locale/ru'
import selectors from './selectors'
import getAllBudgets from './budgetViewSelector'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'budgets',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const {
  getBudgetsToSync,
  getBudgetsByMonthAndTag,
  getBudgetsToSave,
} = selectors
export { getAllBudgets }
