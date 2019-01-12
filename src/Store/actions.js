import * as types from './actionTypes'
import ZenApi from '../services/ZenApi'

export const openTransaction = payload => {
  return { type: types.TRANSACTION_OPEN, payload }
}

export const updateData = changed => (dispatch, getState) => {
  const { token, lastSync } = getState()

  ZenApi.getData(token, { lastSync, changed })
    .then(json => {
      if (json.error) {
        console.warn('!!! Error', json)
      } else {
        dispatch({ type: types.MERGE_SERVER_DATA, payload: json })
      }
    })
    .catch(err => {
      console.warn('!!!', err)
    })
}
