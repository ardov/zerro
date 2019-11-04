import Cookies from 'cookies-js'
import ZenApi from 'services/ZenApi'
import { setToken } from 'store/token'
import { wipeData } from 'store/data/commonActions'
import { syncData } from 'logic/sync'
import { clearLocalData } from './localData'

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
  dispatch(clearLocalData())
  Cookies.expire('token')
}
