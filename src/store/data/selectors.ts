import type { RootState } from '@/store'
import type { TNormalizedPatch } from '@/6-shared/types'
import { createSelector } from '@reduxjs/toolkit'
import {
  getMaterializedOutboxPatches,
  getSyncCursor as getCoreSyncCursor,
} from '@/zerro-core/replica'
import { selectIsSyncPending } from '@/store/sync'
import { immutableMergeDiffs } from './shared/mergeDiffs'

const getBase = (state: RootState) => state.data.base
const getOutbox = (state: RootState) => state.data.outbox
const getRedo = (state: RootState) => state.data.redo

export const getJournalRecoveryRequired = (state: RootState) =>
  state.data.journalRecoveryRequired

export const getJournalRecoveryReason = (state: RootState) =>
  state.data.journalRecoveryReason

export const getOutboxRecoveryReason = (state: RootState) =>
  state.data.outboxRecoveryReason

export const getPersistenceWarning = (state: RootState) =>
  state.data.persistenceWarning

export const getRestoredOutboxCount = (state: RootState) =>
  state.data.restoredOutboxCount

/**
 * Either recovery state means the durable replica cannot accept a local write:
 * the canonical base is unusable, or the outbox those commands would join is
 * quarantined until the user discards it. Sync and persistence make their own,
 * narrower exceptions for the one exchange that resolves each state.
 */
export const getReplicaWriteBlocked = (state: RootState) =>
  state.data.journalRecoveryRequired || state.data.outboxRecoveryReason !== null

export const getPendingSyncDiff = createSelector(
  [getBase, getOutbox],
  (base, outbox) =>
    mergeMaterializedPatches(getMaterializedOutboxPatches(base, outbox))
)

export const getCanUndoClientCommand = (state: RootState) =>
  !selectIsSyncPending(state) &&
  !getReplicaWriteBlocked(state) &&
  getOutbox(state).length > 0

export const getCanRedoClientCommand = (state: RootState) =>
  !selectIsSyncPending(state) &&
  !getReplicaWriteBlocked(state) &&
  getRedo(state).length > 0

/** Commands, not entities: how many undoable actions are waiting to be sent. */
export const getChangedNum = (state: RootState) => getOutbox(state).length

export const getLastChangeTime = createSelector([getOutbox], outbox =>
  outbox.reduce((latest, command) => Math.max(latest, command.issuedAt), 0)
)

export const getLastSyncTime = (state: RootState) => {
  return state.data.current.serverTimestamp
}

/**
 * Read cursor sent to ZenMoney, deliberately one second behind the accepted
 * base.
 *
 * The server returns its own wall clock as `serverTimestamp` and the diff
 * boundary is exclusive (`changed > cursor`). An entity another client commits
 * in the same second as our response would therefore never appear in any later
 * incremental pull. Overlapping by one second re-delivers at most that second
 * of changes, which `applyPatch` merges idempotently.
 */
export const getSyncCursor = (state: RootState) => {
  return getCoreSyncCursor(getLastSyncTime(state))
}

function mergeMaterializedPatches(
  patches: TNormalizedPatch[]
): TNormalizedPatch | undefined {
  if (!patches.length) return undefined
  return patches.reduce<TNormalizedPatch>(immutableMergeDiffs, {})
}
