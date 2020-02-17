import { createAction } from 'redux-starter-kit'

// ACTIONS
export const wipeData = createAction('data/wipeData')
export const updateData = createAction('data/updateData')

// REDUCER FUNCS
export const removeSyncedFunc = (diff, syncStarted) => {
  if (!syncStarted) return
  for (const id in diff) {
    if (diff[id].changed < syncStarted) delete diff[id]
  }
}
