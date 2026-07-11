import reducer from './slice'
export default reducer

// ACTIONS
export {
  applyServerPatch,
  appendClientOutboxEntry,
  undoClientCommand,
  redoClientCommand,
  resetData,
} from './slice'

// SELECTORS
export {
  getDiff,
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
} from './selectors'
