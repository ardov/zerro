import Cookies from 'cookies-js'
import ZenApi from 'shared/api/ZenApi'
import { setToken } from 'models/token'
import { resetData } from 'models/data'
import { syncData } from 'features/sync'
import { clearLocalData } from './localData'
import { AppThunk } from 'models'
import { workerMethods } from 'worker'

export const logIn = (): AppThunk => async (dispatch, getState) => {
  dispatch(logOut())
  const token = await ZenApi.getToken()
  dispatch(setToken(token))
  dispatch(syncData())
}

export const logOut = (): AppThunk => (dispatch, getState) => {
  workerMethods.clearStorage()
  dispatch(resetData())
  dispatch(setToken(null))
  dispatch(clearLocalData())
  Cookies.expire('token')
}
