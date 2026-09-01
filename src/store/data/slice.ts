import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import {
  acceptCanonicalPatch,
  type TAcceptedPushChunk,
  appendOutbox,
  applyPatch,
  applyOutboxCommand,
  createEmptyDataStore,
  getRootUserId,
  redoOutbox,
  replayOutbox,
  undoOutbox,
  undoOutboxTo,
  validateDataStore,
  type TCommand,
} from 'zerro-core/replica'
import { withPerf } from '6-shared/helpers/performance'
import type { TDataStore, TNormalizedPatch } from '6-shared/types'

interface DataSlice {
  rootUserId: number | null
  current: TDataStore
  base: TDataStore
  /** Applied local commands. This is the durable undo stack and sync outbox. */
  outbox: TCommand[]
  /** Undone commands available only until reload, logout, or sync. */
  redo: TCommand[]
  /** The replayed canonical journal failed domain validation and needs a full
   * reload. */
  journalRecoveryRequired: boolean
  journalRecoveryReason: string | null
  /** The canonical state loaded, but the durable local command queue did not
   * pass structural replay and resulting-state validation. */
  outboxRecoveryReason: string | null
  /** Primary persistence is best-effort and stays disabled after its first
   * failure until reload, while Redux remains usable. */
  persistenceWarning: string | null
  /** How many commands came back from persistence at load and have not been
   * pushed since. Session-only: it exists so the app can say the outbox
   * survived a reload, which pull-only sync made possible. */
  restoredOutboxCount: number
  inbox?: TServerInbox | null
}

export type TAcceptedPushReplica = Omit<TAcceptedPushChunk, 'next' | 'progress'>

/** A canonical pull response waiting to be rebased over the outbox. */
export interface TServerInbox extends TNormalizedPatch {
  fullReload?: boolean
}

// INITIAL STATE
const initialBase = createEmptyDataStore()
const initialState: DataSlice = {
  rootUserId: null,
  current: initialBase,
  base: initialBase,
  outbox: [],
  redo: [],
  journalRecoveryRequired: false,
  journalRecoveryReason: null,
  outboxRecoveryReason: null,
  persistenceWarning: null,
  restoredOutboxCount: 0,
}

// SLICE
const { reducer, actions } = createSlice({
  name: 'data',
  initialState,
  reducers: {
    hydrateReplica: withPerf(
      'hydrateReplica',
      (
        state,
        {
          payload,
        }: PayloadAction<{
          rootUserId: number
          base: TDataStore
          outbox: TCommand[]
        }>
      ) => {
        state.rootUserId = payload.rootUserId
        state.base = payload.base
        state.outbox = [...payload.outbox]
        state.redo = []
        state.current = replayOutbox(payload.base, payload.outbox)
        state.restoredOutboxCount = payload.outbox.length
        state.journalRecoveryRequired = false
        state.journalRecoveryReason = null
        state.outboxRecoveryReason = null
      }
    ),
    hydrateCorruptOutbox: withPerf(
      'hydrateCorruptOutbox',
      (
        state,
        {
          payload,
        }: PayloadAction<{
          rootUserId: number
          base: TDataStore
          reason: string
        }>
      ) => {
        state.rootUserId = payload.rootUserId
        state.base = payload.base
        state.current = payload.base
        state.outbox = []
        state.redo = []
        state.restoredOutboxCount = 0
        state.journalRecoveryRequired = false
        state.journalRecoveryReason = null
        state.outboxRecoveryReason = payload.reason
      }
    ),
    hydrateCorruptReplica: withPerf(
      'hydrateCorruptReplica',
      (
        state,
        {
          payload,
        }: PayloadAction<{
          rootUserId: number | null
          journalReason: string
          outboxReason: string
        }>
      ) => {
        const empty = createEmptyDataStore()
        state.rootUserId = payload.rootUserId
        state.base = empty
        state.current = empty
        state.outbox = []
        state.redo = []
        state.restoredOutboxCount = 0
        state.journalRecoveryRequired = true
        state.journalRecoveryReason = payload.journalReason
        state.outboxRecoveryReason = payload.outboxReason
      }
    ),
    receiveServerPatch: withPerf(
      'receiveServerPatch',
      (state, { payload }: PayloadAction<TServerInbox>) => {
        state.inbox = payload
      }
    ),
    rebaseServerInbox: withPerf('rebaseServerInbox', state => {
      if (!state.inbox) return
      const { fullReload, ...canonicalPatch } = state.inbox
      if (fullReload) {
        const recoveringJournal = state.journalRecoveryRequired
        const checkpoint = applyPatch(createEmptyDataStore(), canonicalPatch)
        const checkpointRootUserId = getRootUserId(checkpoint.user)
        const rootUserChanged =
          state.rootUserId !== null &&
          checkpointRootUserId !== null &&
          state.rootUserId !== checkpointRootUserId
        state.rootUserId = checkpointRootUserId ?? state.rootUserId
        if (rootUserChanged) {
          state.outbox = []
          state.redo = []
          state.restoredOutboxCount = 0
        }
        if (recoveringJournal) {
          const replayed = replayAndValidateOutbox(checkpoint, state.outbox)
          if (!replayed.ok) {
            state.base = checkpoint
            state.current = checkpoint
            state.outbox = []
            state.redo = []
            state.restoredOutboxCount = 0
            state.outboxRecoveryReason = replayed.reason
            state.inbox = null
            return
          }
          state.current = replayed.current
        } else {
          state.current = replayOutbox(checkpoint, state.outbox)
        }
        state.journalRecoveryRequired = false
        state.journalRecoveryReason = null
        state.outboxRecoveryReason = null
        state.base = checkpoint
        state.inbox = null
        return
      }
      const accepted = acceptCanonicalPatch(
        { base: state.base, outbox: state.outbox, redo: state.redo },
        canonicalPatch
      )

      state.base = accepted.base
      state.current = accepted.current
      state.outbox = accepted.outbox
      state.redo = accepted.redo
      state.rootUserId = getRootUserId(accepted.base.user) ?? state.rootUserId
      if (state.journalRecoveryRequired) {
        state.journalRecoveryRequired = false
        state.journalRecoveryReason = null
      }
      state.inbox = null
    }),
    acceptClientPushChunk: withPerf(
      'acceptClientPushChunk',
      (state, { payload }: PayloadAction<TAcceptedPushReplica>) => {
        state.base = payload.base
        state.current = payload.current
        state.outbox = payload.outbox
        state.redo = payload.redo
        state.rootUserId = getRootUserId(payload.base.user) ?? state.rootUserId
        state.restoredOutboxCount = 0
      }
    ),
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
      // The user is pushing: whatever survived the reload is on its way out,
      // so the notice about it has nothing left to say.
      state.restoredOutboxCount = 0
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
    hydrateRecoveryOutbox: withPerf(
      'hydrateRecoveryOutbox',
      (
        state,
        {
          payload,
        }: PayloadAction<{
          rootUserId: number | null
          outbox: TCommand[]
          reason: string
        }>
      ) => {
        state.rootUserId = payload.rootUserId
        state.outbox = [...payload.outbox]
        state.redo = []
        state.restoredOutboxCount = payload.outbox.length
        state.journalRecoveryRequired = true
        state.journalRecoveryReason = payload.reason
        state.outboxRecoveryReason = null
      }
    ),
    persistenceFailed: (
      state,
      { payload }: PayloadAction<{ reason: string }>
    ) => {
      state.persistenceWarning = payload.reason
    },
    corruptOutboxDiscarded: state => {
      state.outboxRecoveryReason = null
    },
    recoveryCheckpointPersisted: state => {
      state.journalRecoveryRequired = false
      state.journalRecoveryReason = null
    },
    /**
     * Restores a local (unsent) point by undoing to it, not by diffing and
     * appending: the dropped commands were never sent, so there is nothing on
     * the server to overwrite. Reversible through redo, like a plain undo.
     *
     * `payload` is the same inclusive outbox index a `{ kind: 'local' }`
     * history point ref carries — keep `outbox[0..index]`.
     */
    restoreOutboxPosition: withPerf(
      'restoreOutboxPosition',
      (state, { payload: index }: PayloadAction<number>) => {
        const next = undoOutboxTo(state.outbox, state.redo, index + 1)
        state.outbox = next.outbox
        state.redo = next.redo
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
  hydrateReplica,
  hydrateCorruptOutbox,
  hydrateCorruptReplica,
  receiveServerPatch,
  rebaseServerInbox,
  appendClientCommand,
  prepareClientSync,
  acceptClientPushChunk,
  undoClientCommand,
  redoClientCommand,
  restoreOutboxPosition,
  hydrateRecoveryOutbox,
  persistenceFailed,
  corruptOutboxDiscarded,
  recoveryCheckpointPersisted,
  resetData,
} = actions

function replayAndValidateOutbox(
  base: TDataStore,
  outbox: TCommand[]
): { ok: true; current: TDataStore } | { ok: false; reason: string } {
  try {
    const current = replayOutbox(base, outbox)
    const validation = validateDataStore(current)
    return validation.ok
      ? { ok: true, current }
      : { ok: false, reason: validation.reason }
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}
