import Cookies from 'cookies-js'
import { zenmoney } from 'shared/api/zenmoney'
import { setToken } from 'models/token'
import { resetData } from 'models/data'
import { syncData } from 'features/sync'
import { clearLocalData } from './localData'
import { AppThunk } from 'models'
import { workerMethods } from 'worker'

export const logIn = (): AppThunk => async (dispatch, getState) => {
  dispatch(logOut())
  const token = await zenmoney.getToken()
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
