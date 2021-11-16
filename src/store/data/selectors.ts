import { keys } from 'helpers/keys'
import { RootState } from 'store'
import { Diff, LocalData } from 'types'
import { toServer } from 'worker/zmAdapter'
import { getDiff } from './index'

export const getDataToSave = (state: RootState): LocalData => {
  const data = state.data.server
  if (!data) return { serverTimestamp: 0 }
  let result: Diff = { serverTimestamp: 0 }
  keys(data).forEach(key => {
    if (key === 'serverTimestamp') {
      result[key] = data[key]
    } else {
      result[key] = Object.values(data[key])
    }
  })
  return toServer(result)
}

export const getChangedNum = (state: RootState) => {
  const diff = getDiff(state)
  if (!diff) return 0
  return Object.values(diff).reduce((sum, arr) => sum + arr.length, 0)
}

export const getLastChangeTime = (state: RootState) => {
  const diff = getDiff(state)
  if (!diff) return 0
  let lastChange = 0
  Object.values(diff).forEach(array =>
    array.forEach((item: { changed: number; [x: string]: any }) => {
      lastChange = Math.max(item.changed, lastChange)
    })
  )
  return lastChange
}

// SYNC TIME
export const getLastSyncTime = (state: RootState) =>
  state.data.current.serverTimestamp

// MERCHANTS
export const getMerchants = (state: RootState) => state.data.current.merchant
