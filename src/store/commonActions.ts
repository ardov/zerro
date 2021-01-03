import { createAction } from '@reduxjs/toolkit'
import { ZmDiffObject } from 'types'

interface DataToUpdate {
  data: ZmDiffObject
  syncStartTime?: number
}

// ACTIONS
export const wipeData = createAction('data/wipeData')
export const updateData = createAction<DataToUpdate>('data/updateData')

interface Diff {
  [id: string]: {
    changed: number
    [x: string]: any
  }
}

// REDUCER FUNCS
export const removeSyncedFunc = (diff: Diff, syncStarted?: number) => {
  if (!syncStarted) return
  for (const id in diff) {
    if (diff[id].changed < syncStarted) delete diff[id]
  }
}
