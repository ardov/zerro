import { tokenStorage } from '6-shared/api/tokenStorage'
import { zenmoney } from '6-shared/api/zenmoney'
import { setToken } from 'store/token'
import { resetData } from 'store/data'
import { AppThunk } from 'store'
import { syncData } from '4-features/sync'
import { workerMethods } from 'worker'
import { clearLocalData } from './localData'

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
  tokenStorage.clear()
}
