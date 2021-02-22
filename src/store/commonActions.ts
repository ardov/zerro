import { createAction } from '@reduxjs/toolkit'
import { Diff } from 'types'

interface UpdateData {
  data: Diff
  syncStartTime?: number
}

// ACTIONS
export const wipeData = createAction('data/wipeData')
export const updateData = createAction<UpdateData>('data/updateData')

interface ElementsById {
  [id: string]: {
    changed: number
    [x: string]: any
  }
}

// REDUCER FUNCS
export const removeSyncedFunc = (diff: ElementsById, syncStarted?: number) => {
  if (!syncStarted) return
  for (const id in diff) {
    if (diff[id].changed < syncStarted) delete diff[id]
  }
}
