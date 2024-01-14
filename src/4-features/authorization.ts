import { fakeToken, type EndpointPreference } from '6-shared/config'
import type { AppThunk } from 'store'
import { tokenStorage } from '6-shared/api/tokenStorage'
import { zenmoney } from '6-shared/api/zenmoney'
import { setToken } from 'store/token'
import { applyServerPatch, resetData } from 'store/data'
import { syncData } from '4-features/sync'
import { convertZmToLocal, workerMethods } from 'worker'
import { clearLocalData, saveDataLocally } from './localData'
import { zmPreferenceStorage } from '6-shared/api/zmPreferenceStorage'

export const logOut = (): AppThunk => (dispatch, getState) => {
  workerMethods.clearStorage()
  dispatch(resetData())
  dispatch(setToken(null))
  dispatch(clearLocalData())
  tokenStorage.clear()
}

export const logIn =
  (endpoint: EndpointPreference): AppThunk =>
  async (dispatch, getState) => {
    // Clear all data before logging in
    dispatch(logOut())

    // Get token
    const token = await zenmoney.authorize(endpoint)
    if (!token) return

    // Save token and endpoint preference
    zmPreferenceStorage.set(endpoint)
    tokenStorage.set(token)
    dispatch(setToken(token))

    // Sync data
    dispatch(syncData())
  }

export const loadBackup =
  (file: File): AppThunk<void> =>
  async (dispatch, getState) => {
    try {
      const txt = await file.text()
      const data = JSON.parse(txt)
      const converted = await convertZmToLocal(data)
      // TODO: maybe later make more elegant solution for local data
      tokenStorage.set(fakeToken)
      dispatch(setToken(fakeToken))
      dispatch(applyServerPatch(converted))
      dispatch(saveDataLocally())
    } catch (error) {
      console.error(error)
    }
  }
