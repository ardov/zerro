import { createSlice } from '@reduxjs/toolkit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import { selectors } from './selectors'
import { Budget } from 'types'
import { getBudgetId } from './getBudgetId'

// INITIAL STATE
const initialState: { [key: string]: Budget } = {}

// SLICE
const slice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    setBudget: (state, { payload }) => {
      const budgets = Array.isArray(payload) ? payload : [payload]
      budgets.forEach(budget => {
        const id = getBudgetId(budget)
        state[id] = budget
      })
    },
  },
  extraReducers: builder => {
    builder
      .addCase(wipeData, () => initialState)
      .addCase(updateData, (state, { payload }) => {
        removeSyncedFunc(state, payload.syncStartTime)
      })
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
