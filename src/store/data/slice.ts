import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { materializePatch } from 'core-next/materializer'
import { appendOutbox, type TOutboxEntry } from 'core-next/engine/outbox'
import { withPerf } from '6-shared/helpers/performance'
import { TDataStore, TDiff } from '6-shared/types'
import { applyDiffMutable } from './shared/applyDiff'
import { mergeDiffs } from './shared/mergeDiffs'

interface DataSlice {
  current: TDataStore
  server?: TDataStore
  diff?: TDiff
  /** Transitional runtime outbox; not persisted yet. */
  outbox?: TOutboxEntry<unknown>[]
  outboxHead?: number
}

const makeDataStore = (): TDataStore => ({
  serverTimestamp: 0,
  instrument: {},
  country: {},
  company: {},
  user: {},
  merchant: {},
  account: {},
  tag: {},
  budget: {},
  reminder: {},
  reminderMarker: {},
  transaction: {},
})

// INITIAL STATE
const initialState: DataSlice = {
  current: makeDataStore(),
  server: undefined,
  diff: undefined,
}

interface ExtendedDiff extends TDiff {
  syncStartTime?: number
}

// SLICE
const { reducer, actions } = createSlice({
  name: 'data',
  initialState,
  reducers: {
    applyServerPatch: withPerf(
      'applyServerPatch',
      (state, { payload }: PayloadAction<ExtendedDiff>) => {
        if (!payload) return
        state.server ??= makeDataStore()
        applyDiffMutable(payload, state.server)
        state.current = state.server
        // TODO: Тут хорошо бы не всё удалять, а только то что синхронизировалось (по времени старта). После этого надо ещё current пересобрать на основе серверных данных и диффа
        state.diff = undefined
        state.outbox = []
        state.outboxHead = 0
      }
    ),
    applyClientPatch: withPerf(
      'applyClientPatch',
      (state, { payload }: PayloadAction<TDiff>) => {
        if (!payload) return
        const { appliedPatch } = materializePatch(state.current, payload)
        applyDiffMutable(appliedPatch, state.current)
        if (!state.diff) state.diff = { ...appliedPatch }
        else mergeDiffs(state.diff, appliedPatch)
      }
    ),
    appendClientOutboxEntry: withPerf(
      'appendClientOutboxEntry',
      (state, { payload }: PayloadAction<TOutboxEntry<unknown>>) => {
        const next = appendOutbox(
          state.outbox ?? [],
          state.outboxHead ?? state.outbox?.length ?? 0,
          payload
        )
        state.outbox = next.outbox
        state.outboxHead = next.outboxHead
        applyDiffMutable(payload.appliedPatch, state.current)
        if (!state.diff) state.diff = { ...payload.appliedPatch }
        else mergeDiffs(state.diff, payload.appliedPatch)
      }
    ),
    resetData: () => {
      return initialState
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const {
  applyServerPatch,
  applyClientPatch,
  appendClientOutboxEntry,
  resetData,
} = actions
