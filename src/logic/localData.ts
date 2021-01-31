import { AppThunk } from 'store'
import { updateData } from 'store/commonActions'
import { getDataToSave } from 'store/serverData'
import { LocalData } from 'types'
import { getLocalData, clearStorage, saveLocalData } from 'worker'

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
  const changed = Object.assign(
    {},
    ...changedDomains.map(key => ({ [key]: data[key] }))
  )
  saveLocalData(changed)
}

export const loadLocalData = (): AppThunk => async dispatch => {
  const data = await getLocalData()
  dispatch(updateData({ data }))
  return data
}

export const clearLocalData = (): AppThunk => () => clearStorage()
