import LocalStorage from 'services/localstorage'
import { updateData } from 'store/data/commonActions'
import { getDataToSave } from 'store/data/dataSelectors'

export const saveDataLocally = () => (dispatch, getState) => {
  const state = getState()
  LocalStorage.set('data', getDataToSave(state))
}

export const loadLocalData = () => (dispatch, getState) =>
  new Promise(resolve => {
    const data = LocalStorage.get('data')
    if (data) dispatch(updateData(data))

    resolve()
  })
