import reducer from './slice'
export default reducer

// ACTIONS
export {
  appendClientCommand,
  prepareClientSync,
  undoClientCommand,
  redoClientCommand,
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
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
  getSyncCursor,
} from './selectors'
