import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  appendOutbox,
  clampOutboxHead,
  getPendingOutbox,
  replayOutbox,
  type TOutboxEntry,
} from 'core-next/engine/outbox'
import { withPerf } from '6-shared/helpers/performance'
import { TDataStore, TDiff } from '6-shared/types'
import { applyDiffMutable } from './shared/applyDiff'
import { immutableMergeDiffs } from './shared/mergeDiffs'

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
    appendClientOutboxEntry: withPerf(
      'appendClientOutboxEntry',
      (state, { payload }: PayloadAction<TOutboxEntry<unknown>>) => {
        state.server ??= state.current
        const next = appendOutbox(
          state.outbox ?? [],
          state.outboxHead ?? state.outbox?.length ?? 0,
          payload
        )
        state.outbox = next.outbox
        state.outboxHead = next.outboxHead
        state.current = replayOutbox(
          state.server,
          state.outbox,
          state.outboxHead
        )
        state.diff = buildOutboxDiff(state.outbox, state.outboxHead)
      }
    ),
    undoClientCommand: withPerf('undoClientCommand', state => {
      const outbox = state.outbox ?? []
      const currentHead = state.outboxHead ?? outbox.length
      const outboxHead = clampOutboxHead(currentHead - 1, outbox.length)
      if (outboxHead === currentHead || !state.server) return
      state.outboxHead = outboxHead
      state.current = replayOutbox(state.server, outbox, outboxHead)
      state.diff = buildOutboxDiff(outbox, outboxHead)
    }),
    redoClientCommand: withPerf('redoClientCommand', state => {
      const outbox = state.outbox ?? []
      const currentHead = state.outboxHead ?? outbox.length
      const outboxHead = clampOutboxHead(currentHead + 1, outbox.length)
      if (outboxHead === currentHead || !state.server) return
      state.outboxHead = outboxHead
      state.current = replayOutbox(state.server, outbox, outboxHead)
      state.diff = buildOutboxDiff(outbox, outboxHead)
    }),
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
  appendClientOutboxEntry,
  undoClientCommand,
  redoClientCommand,
  resetData,
} = actions

function buildOutboxDiff(
  outbox: readonly TOutboxEntry<unknown>[],
  outboxHead: number
): TDiff | undefined {
  const pending = getPendingOutbox(outbox, outboxHead)
  if (!pending.length) return undefined
  return pending.reduce<TDiff>(
    (diff, entry) => immutableMergeDiffs(diff, entry.appliedPatch),
    {}
  )
}
