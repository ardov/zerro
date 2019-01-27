import * as types from '../actionTypes'
import Cookies from 'cookies-js'
import ZenApi from '../../services/ZenApi'
import LocalStorage from '../../services/localstorage'

export const openTransaction = id => {
  return { type: types.TRANSACTION_OPEN, payload: id }
}

export const setToken = token => {
  return { type: types.SET_TOKEN, payload: token }
}

export const wipeData = () => {
  return { type: types.WIPE_DATA }
}

export const logIn = () => (dispatch, getState) => {
  dispatch(logOut())
  ZenApi.getToken()
    .then(token => {
      dispatch(setToken(token))
      dispatch(updateData())
    })
    .catch(err => console.warn('!!! Login failed', err))
}

export const logOut = () => (dispatch, getState) => {
  dispatch(wipeData())
  dispatch(setToken(null))
  LocalStorage.clear()
  Cookies.expire('token')
}

export const updateData = changed => (dispatch, getState) => {
  const { token, lastSync } = getState()
  ZenApi.getData(token, { lastSync, changed })
    .then(json => dispatch({ type: types.MERGE_SERVER_DATA, payload: json }))
    .catch(err => console.warn('!!!', err))
}

export const initState = () => dispatch => {
  const localToken = ZenApi.getLocalToken()
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
  const changedTransaction = {
    ...transaction[id],
    deleted: true,
    changed: Date.now() / 1000
  }
  dispatch({ type: types.ADD_FAKE_TRANSACTION, payload: changedTransaction })
  const changed = {
    transaction: [changedTransaction]
  }
  ZenApi.getData(token, { lastSync, changed })
    .then(json => {
      dispatch({ type: types.MERGE_SERVER_DATA, payload: json })
      dispatch({
        type: types.REMOVE_FAKE_TRANSACTION,
        payload: changedTransaction.id
      })
    })
    .catch(err => {
      console.warn('!!!', err)
      dispatch({
        type: types.REMOVE_FAKE_TRANSACTION,
        payload: changedTransaction.id
      })
    })
}

export const restoreTransaction = id => (dispatch, getState) => {
  const { token, lastSync, transaction } = getState()
  const changed = {
    transaction: [
      {
        ...transaction[id],
        deleted: false,
        changed: Date.now() / 1000
      }
    ]
  }
  ZenApi.getData(token, { lastSync, changed })
    .then(json => dispatch({ type: types.MERGE_SERVER_DATA, payload: json }))
    .catch(err => console.warn('!!!', err))
}

export const applyChangesToTransaction = tr => (dispatch, getState) => {
  const { token, lastSync, transaction } = getState()
  const changedTransaction = {
    ...transaction[tr.id],
    ...tr,
    changed: Date.now() / 1000
  }
  dispatch({ type: types.ADD_FAKE_TRANSACTION, payload: changedTransaction })
  const changed = { transaction: [changedTransaction] }

  ZenApi.getData(token, { lastSync, changed })
    .then(json => {
      dispatch({ type: types.MERGE_SERVER_DATA, payload: json })
      dispatch({
        type: types.REMOVE_FAKE_TRANSACTION,
        payload: changedTransaction.id
      })
    })
    .catch(err => {
      console.warn('!!!', err)
      dispatch({
        type: types.REMOVE_FAKE_TRANSACTION,
        payload: changedTransaction.id
      })
    })
}
