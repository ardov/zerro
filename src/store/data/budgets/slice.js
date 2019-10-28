import { createSlice } from 'redux-starter-kit'
import { format } from 'date-fns'
import {
  wipeData,
  updateData,
  removeSynced,
  removeSyncedFunc,
  updateDataFunc,
} from '../commonActions'

// INITIAL STATE
const initialState = { server: {}, diff: {} }

// SLICE
export default createSlice({
  slice: 'budget',
  initialState,
  reducers: {
    setBudget: ({ diff }, { payload }) => {
      const budget = payload
      const id = `${budget.tag},${format(budget.date, 'yyyy-MM-dd')}`
      diff[id] = budget
    },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [removeSynced]: ({ diff }, { payload }) => {
      removeSyncedFunc(diff, payload)
    },
    [updateData]: ({ server }, { payload }) => {
      updateDataFunc(server, payload, 'budget', null, b => `${b.tag},${b.date}`)
    },
  },
})
