import { createSlice } from 'redux-starter-kit'
// import { format } from 'date-fns'
// import ru from 'date-fns/locale/ru'
import { getPopulatedBudgets, getBudgetsByMonthAndTag } from './selectors'
import { getAllBudgets } from './budgetViewSelector'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'budget',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export { getAllBudgets, getPopulatedBudgets, getBudgetsByMonthAndTag }
