import type { EndpointPreference } from '@/6-shared/api/zenmoney'
import type { AppThunk } from '@/store'
import { tokenStorage } from '@/6-shared/api/tokenStorage'
import { zenmoney } from '@/6-shared/api/zenmoney'
import { setToken } from '@/store/token'
import { applyServerPatch, resetData } from '@/store/data'
import { resetViews } from '@/store/view'
import { refreshData } from '@/4-features/sync'
import { convertDiff } from '@/6-shared/api/zm-adapter'
import { clearLocalData } from './localData'
import { zmPreferenceStorage } from '@/6-shared/api/zmPreferenceStorage'
import { getDemoData } from '@/zerro-core/demo'

export const logOut = (): AppThunk<Promise<void>> => async dispatch => {
  dispatch(resetData())
  dispatch(resetViews())
  dispatch(setToken(null))
  tokenStorage.clear()
  await dispatch(clearLocalData())
}

export const logIn =
  (endpoint: EndpointPreference): AppThunk =>
  async dispatch => {
    // Clear all data before logging in
    await dispatch(logOut())

    // Get token
    const token = await zenmoney.authorize(endpoint)
    if (!token) return

    // Save token and endpoint preference
    zmPreferenceStorage.set(endpoint)
    tokenStorage.set(token)
    dispatch(setToken(token))

    // A fresh login has no outbox to push, and keeping the push path to the one
    // deliberate user action makes that invariant auditable.
    dispatch(refreshData())
  }

export const loadBackup =
  (file: File): AppThunk<void> =>
  async dispatch => {
    try {
      const txt = await file.text()
      const data = JSON.parse(txt)
      const converted = convertDiff.toClient(data)
      // TODO: maybe later make more elegant solution for local data
      tokenStorage.set(zenmoney.fakeToken)
      dispatch(setToken(zenmoney.fakeToken))
      dispatch(applyServerPatch(converted))
    } catch (error) {
      console.error(error)
    }
  }

export const loadDemoData = (): AppThunk<void> => async dispatch => {
  try {
    const diff = getDemoData()
    console.log(diff)
    // TODO: maybe later make more elegant solution for local data
    tokenStorage.set(zenmoney.fakeToken)
    dispatch(setToken(zenmoney.fakeToken))
    dispatch(applyServerPatch(diff))
  } catch (error) {
    console.error(error)
  }
}
