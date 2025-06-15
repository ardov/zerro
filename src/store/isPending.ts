import { createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store'

const { reducer, actions } = createSlice({
  name: 'isPending',
  initialState: false,
  reducers: {
    setPending: (state, action) => Boolean(action.payload),
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setPending } = actions

// SELECTORS
export const getPendingState = (state: RootState) => state.isPending
