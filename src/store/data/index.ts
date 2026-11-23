import reducer from './slice'
export default reducer

export {
  appendClientCommand,
  editClientCommand,
  applyServerPatch,
  hydrateReplica,
  hydrateCorruptOutbox,
  hydrateCorruptReplica,
  hydrateRecoveryOutbox,
  corruptOutboxDiscarded,
  recoveryCheckpointPersisted,
  prepareClientSync,
  undoClientCommand,
  redoClientCommand,
  restoreOutboxPosition,
  resetData,
  canReplaceTail,
} from './slice'
export { applyPushChunk } from './applyServerPatch'
export {
  clearPersistedLocalData,
  compactPersistedReplica,
  discardPersistedOutbox,
  persistRecoveryCheckpoint,
  waitForPersistedReplica,
} from './replicaPersistence'

export {
  getPendingSyncDiff,
  getCanUndoClientCommand,
  getCanRedoClientCommand,
  getJournalRecoveryReason,
  getOutboxRecoveryReason,
  getPersistenceWarning,
  getJournalRecoveryRequired,
  getReplicaWriteBlocked,
  getChangedNum,
  getLastSyncTime,
  getSyncCursor,
} from './selectors'
