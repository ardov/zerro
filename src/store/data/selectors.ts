import { RootState } from 'store'
import { getItemsCount } from './shared/getItemsCount'
import { getLastDiffChange } from './shared/getLastDiffChange'

export const getDiff = (state: RootState) => state.data.diff

export const getChangedNum = (state: RootState) => {
  return getItemsCount(getDiff(state))
}

export const getLastChangeTime = (state: RootState) => {
  return getLastDiffChange(getDiff(state))
}

export const getLastSyncTime = (state: RootState) => {
  return state.data.current.serverTimestamp
}
