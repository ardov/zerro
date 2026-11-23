import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { TPushProgressRow } from '@/zerro-core/replica'

export type TLastSyncResult = {
  finishedAt: number
  isSuccessful: boolean
  errorMessage: string | null
}

/** A stopped run keeps its byte bound; a retry derives requests anew from the remaining replica. */
export type TSyncStatus =
  | { kind: 'idle' }
  | { kind: 'pulling' }
  | {
      kind: 'pushing'
      phase: 'sending' | 'waiting'
      rows: TPushProgressRow[]
      retryAt: number | null
      errorMessage: string | null
      errorStatus: number | null
    }
  | {
      kind: 'stopped'
      rows: TPushProgressRow[]
      errorMessage: string
      errorStatus: number | null
      maxBytes: number
    }

export type TSyncProgress = Extract<
  TSyncStatus,
  { kind: 'pushing' } | { kind: 'stopped' }
>

export type TSyncState = {
  status: TSyncStatus
  lastResult: TLastSyncResult | null
  detailsOpen: boolean
}

const initialState: TSyncState = {
  status: { kind: 'idle' },
  lastResult: null,
  detailsOpen: false,
}

const { reducer, actions } = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    syncStarted: state => {
      state.status = { kind: 'pulling' }
      state.detailsOpen = false
    },
    syncStatusChanged: (
      state,
      action: PayloadAction<{ status: TSyncStatus; openDetails?: boolean }>
    ) => {
      state.status = action.payload.status
      if (action.payload.openDetails) state.detailsOpen = true
    },
    syncFinished: (state, action: PayloadAction<TLastSyncResult>) => {
      state.status = { kind: 'idle' }
      state.lastResult = action.payload
      state.detailsOpen = false
    },
    syncDetailsOpened: state => {
      if (state.status.kind !== 'idle') state.detailsOpen = true
    },
    syncDetailsClosed: state => {
      state.detailsOpen = false
    },
  },
})

export default reducer

export const {
  syncDetailsClosed,
  syncDetailsOpened,
  syncFinished,
  syncStarted,
  syncStatusChanged,
} = actions

export const selectSyncStatus = (state: RootState) => state.sync.status

export const selectIsSyncPending = (state: RootState) =>
  state.sync.status.kind !== 'idle'

export const selectLastSyncResult = (state: RootState) => state.sync.lastResult

export const selectSyncProgress = (state: RootState): TSyncProgress | null => {
  const status = state.sync.status
  if (status.kind === 'pushing' || status.kind === 'stopped') return status
  return null
}

export const selectSyncDetailsOpen = (state: RootState) =>
  state.sync.detailsOpen
