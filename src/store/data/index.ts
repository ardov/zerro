import reducer from './slice'
export default reducer

// ACTIONS
export { applyServerPatch, applyClientPatch, resetData } from './slice'

// SELECTORS
export { getDiff } from './slice'
export {
  getDataToSave,
  getChangedNum,
  getLastChangeTime,
  getLastSyncTime,
} from //  getMerchants,
'./selectors'
