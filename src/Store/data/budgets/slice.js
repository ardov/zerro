import { createSlice } from 'redux-starter-kit'
import { format } from 'date-fns'
import {
  wipeData,
  updateData,
  removeSynced,
  removeSyncedFunc,
} from '../commonActions'
import { convertDatesToMs } from 'Utils/converters'

// INITIAL STATE
const initialState = { server: {}, diff: {} }

// SLICE
export default createSlice({
  slice: 'budgets',
  initialState,
  reducers: {
    setBudget: ({ diff }, { payload }) => {
      const budget = payload
      const id = `${budget.tag},${format(budget.date, 'YYYY-MM-DD')}`
      diff[id] = budget
    },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [removeSynced]: ({ diff }, { payload }) => {
      removeSyncedFunc(diff, payload)
    },
    [updateData]: ({ server }, { payload }) => {
      const budgets = payload.budget
      if (budgets) {
        budgets.forEach(budget => {
          server[`${budget.tag},${budget.date}`] = convertDatesToMs(budget)
        })
      }
    },
  },
})
