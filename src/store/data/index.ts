import reducer from './slice'
export default reducer

// ACTIONS
export { applyServerPatch, applyClientPatch, resetData } from './slice'

// SELECTORS
export {
  getDiff,
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
} from './selectors'
