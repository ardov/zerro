import { createAction } from 'redux-starter-kit'

// ACTIONS
export const wipeData = createAction('data/wipeData')
export const updateData = createAction('data/updateData')
export const removeSynced = createAction('data/removeSyncedFakes')
export const removeSyncedFunc = ({ diff }, { payload }) => {
  const syncStarted = payload
  Object.keys(diff).forEach(id => {
    if (diff[id].changed < syncStarted) {
      delete diff[id]
    }
  })
}
