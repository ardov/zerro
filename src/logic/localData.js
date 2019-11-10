import StorageFactory from 'services/storage'
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

const storage = StorageFactory.create()

export const saveDataLocally = changedDomains => (dispatch, getState) => {
  const state = getState()
  const data = getDataToSave(state)
  changedDomains.forEach(key => storage.set(key, data[key]))
}

export const loadLocalData = () => (dispatch, getState) =>
  new Promise(resolve => {
    let promises = []
    let data = []

    LOCAL_KEYS.forEach(name => {
      promises.push(new Promise((resolve, reject) => {
          data[name] = storage.get(name)
      }))
    })

    Promise.all(promises).then(values => {
      if (data) dispatch(updateData(data))
    });

    resolve()
  })

export const clearLocalData = () => (dispatch, getState) => {
  LOCAL_KEYS.forEach(key => {
    storage.remove(key)
  })

  // for old versions
  storage.remove('data')
}
