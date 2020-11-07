import { createSlice } from 'redux-starter-kit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import selectors from './selectors'
import { formatDate } from 'helpers/format'

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
        const id = `${budget.tag},${formatDate(budget.date, 'yyyy-MM-dd')}`
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
} = selectors
