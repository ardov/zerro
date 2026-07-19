import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  appendOutbox,
  applyOutboxCommand,
  clampOutboxHead,
  getPendingOutbox,
  replayOutbox,
} from 'zerro-core/infrastructure/replica/outbox'
import type { TCommand } from 'zerro-core/infrastructure/replica/outbox'
import {
  replicaPersistenceVersion,
  type TPersistedReplica,
} from 'zerro-core/infrastructure/replica/persistence'
import { withPerf } from '6-shared/helpers/performance'
import { TDataStore, TDiff } from '6-shared/types'
import { applyDiffMutable } from './shared/applyDiff'

interface DataSlice {
  current: TDataStore
  base: TDataStore
  /** Durable local commands; current rematerializes from the command prefix. */
  outbox: TCommand[]
  outboxHead: number
  inbox?: TServerInbox | null
}

export interface TServerInbox extends TDiff {
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
  outboxHead: 0,
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

      const pending = getPendingOutbox(state.outbox, state.outboxHead)
      state.outbox =
        sentOutboxCount === undefined ? pending : pending.slice(sentOutboxCount)
      state.outboxHead = state.outbox.length
      state.current = replayOutbox(state.base, state.outbox, state.outboxHead)
      state.inbox = null
    }),
    appendClientCommand: withPerf(
      'appendClientCommand',
      (state, { payload }: PayloadAction<TCommand>) => {
        const next = appendOutbox(state.outbox, state.outboxHead, payload)
        state.outbox = next.outbox
        state.outboxHead = next.outboxHead
        // `current` already reflects the command prefix up to the old head, and
        // appendOutbox drops any redo tail past it, so advancing by this one
        // entry is equivalent to a full replay but keeps unrelated entity maps
        // reference-stable for memoized selectors.
        state.current = applyOutboxCommand(state.current, payload)
      }
    ),
    prepareClientSync: withPerf('prepareClientSync', state => {
      const outbox = getPendingOutbox(state.outbox, state.outboxHead)
      state.outbox = outbox
      state.outboxHead = outbox.length
    }),
    undoClientCommand: withPerf('undoClientCommand', state => {
      const outbox = state.outbox
      const currentHead = state.outboxHead
      const outboxHead = clampOutboxHead(currentHead - 1, outbox.length)
      if (outboxHead === currentHead) return
      state.outboxHead = outboxHead
      state.current = replayOutbox(state.base, outbox, outboxHead)
    }),
    redoClientCommand: withPerf('redoClientCommand', state => {
      const outbox = state.outbox
      const currentHead = state.outboxHead
      const outboxHead = clampOutboxHead(currentHead + 1, outbox.length)
      if (outboxHead === currentHead) return
      state.outboxHead = outboxHead
      state.current = replayOutbox(state.base, outbox, outboxHead)
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
          state.outboxHead = 0
          state.current = state.base
          return
        }

        state.outbox = [...payload.outbox]
        state.outboxHead = clampOutboxHead(
          payload.outboxHead,
          payload.outbox.length
        )
        state.current = replayOutbox(state.base, state.outbox, state.outboxHead)
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
