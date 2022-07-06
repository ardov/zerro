import reducer from './slice'
export default reducer

// ACTIONS
export { applyServerPatch, applyClientPatch, resetData } from './slice'

// SELECTORS
export { getDiff } from './slice'
export { getChangedNum, getLastChangeTime, getLastSyncTime } from './selectors'
