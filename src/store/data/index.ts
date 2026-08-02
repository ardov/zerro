import reducer from './slice'
export default reducer

// ACTIONS
export {
  appendClientCommand,
  prepareClientSync,
  undoClientCommand,
  redoClientCommand,
  restorePersistedJournal,
  restorePersistedReplica,
  resetData,
} from './slice'
export { applyServerPatch } from './applyServerPatch'
export { clearPersistedLocalData } from './replicaPersistence'

// SELECTORS
export {
  getPendingSyncDiff,
  getPendingSyncTransport,
  getCanUndoClientCommand,
  getCanRedoClientCommand,
  getJournalRecoveryReason,
  getJournalRecoveryRequired,
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
  getSyncCursor,
} from './selectors'
