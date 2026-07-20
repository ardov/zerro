import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import {
  appendOutbox,
  applyOutboxCommand,
  redoOutbox,
  replayOutbox,
  replicaPersistenceVersion,
  undoOutbox,
  type TCommand,
  type TPersistedReplica,
} from 'zerro-core/replica'
import { withPerf } from '6-shared/helpers/performance'
import type { TDataStore, TNormalizedPatch } from '6-shared/types'
import { applyDiffMutable } from './shared/applyDiff'

interface DataSlice {
  current: TDataStore
  base: TDataStore
  /** Applied local commands. This is the durable undo stack and sync outbox. */
  outbox: TCommand[]
  /** Undone commands available only until reload, logout, or sync. */
  redo: TCommand[]
  inbox?: TServerInbox | null
}

export interface TServerInbox extends TNormalizedPatch {
  sentOutboxCount?: number
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
const initialBase = makeDataStore()
const initialState: DataSlice = {
  current: initialBase,
  base: initialBase,
  outbox: [],
  redo: [],
}

// SLICE
const { reducer, actions } = createSlice({
  name: 'data',
  initialState,
  reducers: {
    receiveServerPatch: withPerf(
      'receiveServerPatch',
      (state, { payload }: PayloadAction<TServerInbox>) => {
        state.inbox = payload
      }
    ),
    rebaseServerInbox: withPerf('rebaseServerInbox', state => {
      if (!state.inbox) return
      const { sentOutboxCount, ...canonicalPatch } = state.inbox

      applyDiffMutable(canonicalPatch, state.base)

      state.outbox =
        sentOutboxCount === undefined
          ? state.outbox
          : state.outbox.slice(sentOutboxCount)
      state.redo = []
      state.current = replayOutbox(state.base, state.outbox)
      state.inbox = null
    }),
    appendClientCommand: withPerf(
      'appendClientCommand',
      (state, { payload }: PayloadAction<TCommand>) => {
        const next = appendOutbox(state.outbox, payload)
        state.outbox = next.outbox
        state.redo = next.redo
        // `current` already reflects the durable outbox, so advancing by this
        // one entry is equivalent to a full replay but keeps unrelated entity
        // maps reference-stable for memoized selectors.
        state.current = applyOutboxCommand(state.current, payload)
      }
    ),
    prepareClientSync: withPerf('prepareClientSync', state => {
      state.redo = []
    }),
    undoClientCommand: withPerf('undoClientCommand', state => {
      if (!state.outbox.length) return
      const next = undoOutbox(state.outbox, state.redo)
      state.outbox = next.outbox
      state.redo = next.redo
      state.current = replayOutbox(state.base, state.outbox)
    }),
    redoClientCommand: withPerf('redoClientCommand', state => {
      if (!state.redo.length) return
      const next = redoOutbox(state.outbox, state.redo)
      state.outbox = next.outbox
      state.redo = next.redo
      state.current = replayOutbox(state.base, state.outbox)
    }),
    restorePersistedReplica: withPerf(
      'restorePersistedReplica',
      (state, { payload }: PayloadAction<TPersistedReplica | undefined>) => {
        if (
          !payload ||
          payload.version !== replicaPersistenceVersion ||
          payload.baseServerTimestamp !== state.base.serverTimestamp
        ) {
          state.outbox = []
          state.redo = []
          state.current = state.base
          return
        }

        state.outbox = [...payload.outbox]
        state.redo = []
        state.current = replayOutbox(state.base, state.outbox)
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
  receiveServerPatch,
  rebaseServerInbox,
  appendClientCommand,
  prepareClientSync,
  undoClientCommand,
  redoClientCommand,
  restorePersistedReplica,
  resetData,
} = actions
