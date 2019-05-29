import LocalStorage from '../services/localstorage'
import Cookies from 'cookies-js'
import ZenApi from '../services/ZenApi'
import { setToken } from '../store/token'
import { wipeData } from '../store/data'
import { syncData } from '../store/data/thunks'

export const logIn = () => (dispatch, getState) => {
  dispatch(logOut())
  ZenApi.getToken()
    .then(token => {
      dispatch(setToken(token))
      dispatch(syncData())
    })
    .catch(err => console.warn('!!! Login failed', err))
}

export const logOut = () => (dispatch, getState) => {
  dispatch(wipeData())
  dispatch(setToken(null))
  LocalStorage.clear()
  Cookies.expire('token')
}
