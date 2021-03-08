import { createSlice } from '@reduxjs/toolkit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import { selectors } from './selectors'
import { Budget } from 'types'

// INITIAL STATE
const initialState: { [key: string]: Budget } = {}

// SLICE
const slice = createSlice({
  name: 'budget',
  initialState,
  reducers: {},
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

// SELECTORS
export const { getBudgetsByMonthAndTag, getBudget } = selectors
