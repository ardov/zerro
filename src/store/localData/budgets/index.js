import { createSlice } from 'redux-starter-kit'
import { format } from 'date-fns'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import selectors from './selectors'

// INITIAL STATE
const initialState = {}

// SLICE
const slice = createSlice({
  slice: 'budget',
  initialState,
  reducers: {
    setBudget: (state, { payload }) => {
      const budgets = Array.isArray(payload) ? payload : [payload]
      budgets.forEach(budget => {
        const id = `${budget.tag},${format(budget.date, 'yyyy-MM-dd')}`
        state[id] = budget
      })
    },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      removeSyncedFunc(state, payload.syncStartTime)
    },
  },
})

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
