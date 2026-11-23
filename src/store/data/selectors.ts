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

/** Recovery blocks local durable writes. Sync and persistence allow only the exchange that resolves the active recovery state. */
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

export const getChangedNum = (state: RootState) => getOutbox(state).length

export const getLastSyncTime = (state: RootState) => {
  return state.data.current.serverTimestamp
}

/** Overlap one second because Zenmoney's changed > cursor boundary is exclusive; duplicate changes merge idempotently. */
export const getSyncCursor = (state: RootState) => {
  return getCoreSyncCursor(getLastSyncTime(state))
}

function mergeMaterializedPatches(
  patches: TNormalizedPatch[]
): TNormalizedPatch | undefined {
  if (!patches.length) return undefined
  return patches.reduce<TNormalizedPatch>(immutableMergeDiffs, {})
}
