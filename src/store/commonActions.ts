import { createAction } from 'redux-starter-kit'

// ACTIONS
export const wipeData = createAction('data/wipeData')
export const updateData = createAction('data/updateData')

interface Diff {
  [id: string]: {
    changed: number
    [x: string]: any
  }
}

// REDUCER FUNCS
export const removeSyncedFunc = (diff: Diff, syncStarted: number) => {
  if (!syncStarted) return
  for (const id in diff) {
    if (diff[id].changed < syncStarted) delete diff[id]
  }
}
