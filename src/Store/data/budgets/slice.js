import { createSlice } from 'redux-starter-kit'
import {
  wipeData,
  updateData,
  removeSynced,
  removeSyncedFunc,
} from '../commonActions'

// INITIAL STATE
const initialState = { server: {}, diff: {} }

// SLICE
export default createSlice({
  slice: 'budgets',
  initialState,
  reducers: {
    setBudget: ({ diff }, { payload }) => {
      const budget = payload
      const id = `${budget.tag},${budget.date}`
      diff[id] = budget
    },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [removeSynced]: removeSyncedFunc,
    [updateData]: ({ server }, { payload }) => {
      if (payload.budget) {
        payload.budget.forEach(
          budget => (server[`${budget.tag},${budget.date}`] = budget)
        )
      }
    },
  },
})
