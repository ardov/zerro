import * as types from '../actionTypes'
import ZenApi from '../../services/ZenApi'
import Cookies from '../../services/cookies'
import LocalStorage from '../../services/localstorage'

export const openTransaction = id => {
  return { type: types.TRANSACTION_OPEN, payload: id }
}

export const setToken = token => {
  return { type: types.SET_TOKEN, payload: token }
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

export const initState = () => dispatch => {
  const localToken = Cookies.get('token')
  const localData = LocalStorage.get('data')
  if (localToken) {
    dispatch({ type: types.SET_TOKEN, payload: localToken })
    if (localData) {
      dispatch({ type: types.SET_LOCAL_STATE, payload: localData })
    } else {
      dispatch({ type: types.UPDATE_DATA })
    }
  }
}

export const deleteTransaction = id => (dispatch, getState) => {
  const { token, lastSync, transaction } = getState()
  const changed = {
    transaction: [
      {
        ...transaction[id],
        deleted: true,
        changed: Date.now() / 1000
      }
    ]
  }

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
