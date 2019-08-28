import LocalStorage from 'services/localstorage'
import { updateData } from 'store/data/commonActions'
import { getDataToSave } from 'store/data/dataSelectors'

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
  changedDomains.forEach(key => LocalStorage.set(key, data[key]))
}

export const loadLocalData = () => (dispatch, getState) =>
  new Promise(resolve => {
    const data = LOCAL_KEYS.reduce((data, key) => {
      data[key] = LocalStorage.get(key)
      return data
    }, {})
    if (data) dispatch(updateData(data))

    resolve()
  })

export const clearLocalData = () => (dispatch, getState) => {
  LOCAL_KEYS.forEach(key => {
    LocalStorage.remove(key)
  })

  // for old versions
  LocalStorage.remove('data')
}
