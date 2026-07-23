import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from 'store'

export type TLastSyncResult = {
  finishedAt: number
  isSuccessful: boolean
  errorMessage: string | null
}

export type TSyncState = {
  status: 'idle' | 'pending'
  lastResult: TLastSyncResult | null
}

const initialState: TSyncState = {
  status: 'idle',
  lastResult: null,
}

const { reducer, actions } = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    syncStarted: state => {
      state.status = 'pending'
    },
    syncFinished: (state, action: PayloadAction<TLastSyncResult>) => {
      state.status = 'idle'
      state.lastResult = action.payload
    },
  },
})

export default reducer

export const { syncStarted, syncFinished } = actions

export const selectIsSyncPending = (state: RootState) =>
  state.sync.status === 'pending'

export const selectLastSyncResult = (state: RootState) => state.sync.lastResult
