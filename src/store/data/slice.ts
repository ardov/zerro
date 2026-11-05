import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice, original } from '@reduxjs/toolkit'
import {
  acceptCanonicalPatch,
  type TAcceptedPushChunk,
  appendOutbox,
  editOutbox,
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
} from '@/zerro-core/replica'
import { withPerf } from '@/6-shared/helpers/performance'
import type { TDataStore, TNormalizedPatch } from '@/6-shared/types'

interface DataSlice {
  rootUserId: number | null
  current: TDataStore
  base: TDataStore
  /** Applied local commands. This is the durable undo stack and sync outbox. */
  outbox: TCommand[]
  /** The outbox tail an `editClientCommand` of the same group may replace.
   * Any other change to the tail seals it, and so do sync and undo. */
  editableTail: { group: string; command: TCommand } | null
  /** Undone commands; pulls preserve them, a new command or push clears them. */
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
}

export type TAcceptedPushReplica = Omit<TAcceptedPushChunk, 'next' | 'progress'>

/** A canonical pull response, optionally replacing the complete base. */
export interface TServerPatch extends TNormalizedPatch {
  fullReload?: boolean
}

// INITIAL STATE
const initialBase = createEmptyDataStore()
const initialState: DataSlice = {
  rootUserId: null,
  current: initialBase,
  base: initialBase,
  outbox: [],
  editableTail: null,
  redo: [],
  journalRecoveryRequired: false,
  journalRecoveryReason: null,
  outboxRecoveryReason: null,
  persistenceWarning: null,
}

// SLICE
/** True while the outbox tail is still the group's own edit. */
export function canReplaceTail(
  data: Pick<DataSlice, 'outbox' | 'editableTail'>,
  group: string
): boolean {
  const tail = data.editableTail
  return tail?.group === group && data.outbox.at(-1) === tail.command
}

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
        state.journalRecoveryRequired = true
        state.journalRecoveryReason = payload.journalReason
        state.outboxRecoveryReason = payload.outboxReason
      }
    ),
    applyServerPatch: withPerf(
      'applyServerPatch',
      (state, { payload }: PayloadAction<TServerPatch>) => {
        // Core results share entity references with their input. Keep Immer
        // drafts out of those snapshots, including when auto-freeze is off.
        const snapshot = original(state)!
        const { fullReload, ...canonicalPatch } = payload
        if (fullReload) {
          const checkpoint = applyPatch(createEmptyDataStore(), canonicalPatch)
          // Validate the server snapshot before attributing a replay failure
          // to local commands. A rejected response must not replace the last
          // accepted base or discard the pending outbox.
          const validation = validateDataStore(checkpoint)
          if (!validation.ok) {
            state.journalRecoveryRequired = true
            state.journalRecoveryReason = validation.reason
            return
          }
          const checkpointRootUserId = getRootUserId(checkpoint.user)
          const rootUserChanged =
            state.rootUserId !== null &&
            checkpointRootUserId !== null &&
            state.rootUserId !== checkpointRootUserId
          state.rootUserId = checkpointRootUserId ?? state.rootUserId
          if (rootUserChanged) {
            state.outbox = []
            state.redo = []
          }
          const outbox = rootUserChanged ? [] : snapshot.outbox
          const replayed = replayAndValidateOutbox(checkpoint, outbox)
          if (!replayed.ok) {
            state.base = checkpoint
            state.current = checkpoint
            state.outbox = []
            state.redo = []
            state.outboxRecoveryReason = replayed.reason
            // Keep the raw persisted outbox untouched. The validated
            // checkpoint can be persisted after an explicit discard.
            state.journalRecoveryRequired = true
            state.journalRecoveryReason = null
            return
          }
          state.current = replayed.current
          state.journalRecoveryRequired = false
          state.journalRecoveryReason = null
          state.outboxRecoveryReason = null
          state.base = checkpoint
          return
        }
        const accepted = acceptCanonicalPatch(snapshot, canonicalPatch)

        state.base = accepted.base
        state.current = accepted.current
        state.outbox = accepted.outbox
        state.redo = accepted.redo
        state.rootUserId = getRootUserId(accepted.base.user) ?? state.rootUserId
        if (state.journalRecoveryRequired) {
          state.journalRecoveryRequired = false
          state.journalRecoveryReason = null
        }
      }
    ),
    acceptClientPushChunk: withPerf(
      'acceptClientPushChunk',
      (state, { payload }: PayloadAction<TAcceptedPushReplica>) => {
        state.base = payload.base
        state.current = payload.current
        state.outbox = payload.outbox
        state.redo = payload.redo
        state.rootUserId = getRootUserId(payload.base.user) ?? state.rootUserId
      }
    ),
    appendClientCommand: withPerf(
      'appendClientCommand',
      (state, { payload }: PayloadAction<TCommand>) => {
        // Core reads immutable snapshots; passing an Immer proxy would draft
        // every transaction while copying the touched map.
        const snapshot = original(state)!
        const next = appendOutbox(snapshot.outbox, payload)
        state.outbox = next.outbox
        state.redo = next.redo
        // `current` already reflects the durable outbox, so advancing by this
        // one entry is equivalent to a full replay but keeps unrelated entity
        // maps reference-stable for memoized selectors.
        state.current = applyOutboxCommand(snapshot.current, payload)
      }
    ),
    editClientCommand: (
      state,
      {
        payload,
      }: PayloadAction<{
        group: string
        command: TCommand | null
        current: TDataStore
      }>
    ) => {
      const snapshot = original(state)!
      const next = editOutbox(
        snapshot.outbox,
        payload.command,
        canReplaceTail(snapshot, payload.group)
      )
      state.outbox = next.outbox
      state.redo = next.redo
      state.editableTail = payload.command
        ? { group: payload.group, command: payload.command }
        : null
      state.current = payload.current
    },
    prepareClientSync: withPerf('prepareClientSync', state => {
      state.editableTail = null
      state.redo = []
    }),
    undoClientCommand: withPerf('undoClientCommand', state => {
      state.editableTail = null
      if (!state.outbox.length) return
      const snapshot = original(state)!
      const next = undoOutbox(snapshot.outbox, snapshot.redo)
      state.outbox = next.outbox
      state.redo = next.redo
      state.current = replayOutbox(snapshot.base, next.outbox)
    }),
    redoClientCommand: withPerf('redoClientCommand', state => {
      if (!state.redo.length) return
      const snapshot = original(state)!
      const next = redoOutbox(snapshot.outbox, snapshot.redo)
      state.outbox = next.outbox
      state.redo = next.redo
      state.current = replayOutbox(snapshot.base, next.outbox)
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
        const snapshot = original(state)!
        const next = undoOutboxTo(snapshot.outbox, snapshot.redo, index + 1)
        state.outbox = next.outbox
        state.redo = next.redo
        state.current = replayOutbox(snapshot.base, next.outbox)
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
  applyServerPatch,
  appendClientCommand,
  editClientCommand,
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
  // The full snapshot has already passed validation.
  if (!outbox.length) return { ok: true, current: base }
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
