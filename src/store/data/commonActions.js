import { createAction } from 'redux-starter-kit'
import { convertDatesToMs } from 'helpers/converters'

// ACTIONS
export const wipeData = createAction('data/wipeData')
export const updateData = createAction('data/updateData')
export const removeSynced = createAction('data/removeSyncedFakes')

// REDUCER FUNCS
export const removeSyncedFunc = (diff, syncStarted) => {
  Object.keys(diff).forEach(id => {
    if (diff[id].changed < syncStarted) {
      delete diff[id]
    }
  })
}

/**
 * Updates items in state
 */
export const updateDataFunc = (
  state,
  payload,
  domain = '',
  converter,
  getId
) => {
  if (payload[domain]) {
    payload[domain].forEach(item => {
      const id = getId ? getId(item) : item.id
      state[id] = converter ? converter(item) : convertDatesToMs(item)
    })
  }
  if (payload.deletion) {
    payload.deletion.forEach(item => {
      if (item.object === domain) delete state[item.id]
    })
  }
}
