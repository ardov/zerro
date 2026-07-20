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

// SELECTORS
export {
  getPendingSyncDiff,
  getPendingSyncTransport,
  getHasPendingChanges,
  getCanUndoClientCommand,
  getCanRedoClientCommand,
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
} from './selectors'
