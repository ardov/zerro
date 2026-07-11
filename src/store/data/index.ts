import reducer from './slice'
export default reducer

// ACTIONS
export {
  applyServerPatch,
  applyClientPatch,
  appendClientOutboxEntry,
  resetData,
} from './slice'

// SELECTORS
export {
  getDiff,
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
} from './selectors'
