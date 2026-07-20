import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from 'store'

interface LastSync {
  finishedAt: number
  isSuccessful: boolean | null
  errorMessage: string | null
}

const initialState: LastSync = {
  finishedAt: 0,
  isSuccessful: null,
  errorMessage: null,
}

const { reducer, actions } = createSlice({
  name: 'lastSync',
  initialState,
  reducers: {
    setSyncData: (state, action: PayloadAction<LastSync>) => ({
      ...state,
      ...action.payload,
    }),
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setSyncData } = actions

// SELECTORS
export const getLastSyncInfo = (state: RootState) => state.lastSync
