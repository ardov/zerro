import Cookies from 'cookies-js'
import ZenApi from 'services/ZenApi'
import { setToken } from 'store/token'
import { wipeData } from 'store/commonActions'
import { syncData } from 'logic/sync'
import { clearLocalData } from './localData'
import { AppThunk } from 'store'

export const logIn = (): AppThunk => async (dispatch, getState) => {
  dispatch(logOut())
  const token = await ZenApi.getToken()
  dispatch(setToken(token))
  dispatch(syncData())
}

export const logOut = (): AppThunk => (dispatch, getState) => {
  dispatch(wipeData())
  dispatch(setToken(null))
  dispatch(clearLocalData())
  Cookies.expire('token')
}
