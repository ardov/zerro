import type { RootState } from 'store'
import { getItemsCount } from './shared/getItemsCount'
import type { TNormalizedPatch } from '6-shared/types'
import { createSelector } from '@reduxjs/toolkit'
import {
  buildOutboxTransport,
  getMaterializedOutboxPatches,
  getSyncCursor as getCoreSyncCursor,
} from 'zerro-core/replica'
import { immutableMergeDiffs } from './shared/mergeDiffs'

const getBase = (state: RootState) => state.data.base
const getOutbox = (state: RootState) => state.data.outbox
const getRedo = (state: RootState) => state.data.redo

export const getPendingSyncDiff = createSelector(
  [getBase, getOutbox],
  (base, outbox) =>
    mergeMaterializedPatches(getMaterializedOutboxPatches(base, outbox))
)

export function getPendingSyncTransport(
  state: RootState,
  sentAt: number
): TNormalizedPatch | undefined {
  return buildOutboxTransport(state.data.base, state.data.outbox, sentAt)
}

export const getCanUndoClientCommand = (state: RootState) =>
  state.sync.status !== 'pending' && getOutbox(state).length > 0

export const getCanRedoClientCommand = (state: RootState) =>
  state.sync.status !== 'pending' && getRedo(state).length > 0

export const getChangedNum = (state: RootState) => {
  return getItemsCount(getPendingSyncDiff(state))
}

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
