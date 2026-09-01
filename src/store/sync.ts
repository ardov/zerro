import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { TPushProgressRow } from '@/zerro-core/replica'

export type TLastSyncResult = {
  finishedAt: number
  isSuccessful: boolean
  errorMessage: string | null
}

/**
 * What synchronization is doing right now, as one value.
 *
 * Everything a screen needs about a running push hangs off the state it
 * belongs to, so "stopped without a remainder" or "sending with no rows" are
 * not states this slice can hold. The stopped variant keeps `maxBytes` rather
 * than a prepared request: a retry re-derives the run from the replica, which
 * is the same path a reload takes.
 */
export type TSyncStatus =
  | { kind: 'idle' }
  /** A pull with nothing of ours to acknowledge. */
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

/** The states a progress surface has something to show for. */
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
    /**
     * The only way a push run reports itself. The thunk owns the state
     * machine; this slice just holds the state it is in.
     */
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

/** The rows and phase a progress surface renders, or nothing to render. */
export const selectSyncProgress = (state: RootState): TSyncProgress | null => {
  const status = state.sync.status
  if (status.kind === 'pushing' || status.kind === 'stopped') return status
  return null
}

export const selectSyncDetailsOpen = (state: RootState) =>
  state.sync.detailsOpen
