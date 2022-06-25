import { AppThunk } from 'models'
import { applyServerPatch } from 'models/data'
import { getDataToSave } from 'models/data/selectors'
import { TLocalData } from 'shared/types'
import { getLocalData, clearStorage, saveLocalData } from 'worker'

type LocalKey = keyof TLocalData

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

export const saveDataLocally =
  (changedDomains = LOCAL_KEYS): AppThunk =>
  (dispatch, getState) => {
    const state = getState()
    const data = getDataToSave(state)
    const changed = Object.assign(
      {},
      ...changedDomains.map(key => ({ [key]: data[key] }))
    )

    saveLocalData(changed)
  }

export const loadLocalData = (): AppThunk => async dispatch => {
  const data = await getLocalData()
  dispatch(applyServerPatch(data))
  return data
}

export const clearLocalData = (): AppThunk => () => clearStorage()
