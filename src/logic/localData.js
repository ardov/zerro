import storage from 'services/storage'
import { updateData } from 'store/serverData'
import { getDataToSave } from 'store/serverData'

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
]

export const saveDataLocally = changedDomains => (dispatch, getState) => {
  const state = getState()
  const data = getDataToSave(state)
  changedDomains.forEach(key => storage.set(key, data[key]))
}

export const loadLocalData = () => async (dispatch, getState) => {
  let data = {}
  for (let i = 0; i < LOCAL_KEYS.length; i++) {
    const key = LOCAL_KEYS[i]
    data[key] = await storage.get(key)
  }
  dispatch(updateData(data))
  return data
}

export const clearLocalData = () => (dispatch, getState) => {
  storage.clear()
}
