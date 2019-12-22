import { createSlice } from 'redux-starter-kit'
import { format } from 'date-fns'
import { wipeData, removeSynced, removeSyncedFunc } from '../commonActions'

// INITIAL STATE
const initialState = {}

// SLICE
export default createSlice({
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
    [removeSynced]: (state, { payload }) => {
      removeSyncedFunc(state, payload)
    },
  },
})
