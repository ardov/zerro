import storage from 'services/storage'
import { AppThunk } from 'store'
import { updateData } from 'store/commonActions'
import { getDataToSave } from 'store/serverData'
import { LocalData } from 'types'

type LocalKey = keyof LocalData

const LOCAL_KEYS = [
  'serverTimestamp',
  'instrument',
  'user',
  'merchant',
  'country',
  'company',
  'reminder',
  'reminderMarker',
  'account',
  'tag',
  'budget',
  'transaction',
] as LocalKey[]

export const saveDataLocally = (changedDomains = LOCAL_KEYS): AppThunk => (
  dispatch,
  getState
) => {
  const state = getState()
  const data = getDataToSave(state)
  changedDomains.forEach(key => storage.set(key, data[key]))
}

export const loadLocalData = (): AppThunk => async dispatch => {
  let data = {} as LocalData
  for (const key of LOCAL_KEYS) {
    data[key] = await storage.get(key)
  }
  dispatch(updateData({ data }))
  return data
}

export const clearLocalData = (): AppThunk => () => {
  storage.clear()
}
