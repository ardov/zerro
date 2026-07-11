import reducer from './slice'
export default reducer

// ACTIONS
export {
  appendClientOutboxEntry,
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
  getHasPendingChanges,
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
} from './selectors'
