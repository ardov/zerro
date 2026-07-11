import reducer from './slice'
export default reducer

// ACTIONS
export {
  appendClientOutboxEntry,
  undoClientCommand,
  redoClientCommand,
  restorePersistedReplica,
  resetData,
} from './slice'
export { applyServerPatch } from './applyServerPatch'

// SELECTORS
export {
  getDiff,
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
} from './selectors'
