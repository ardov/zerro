import { AppThunk } from 'store'
import {
  applyServerPatch,
  clearPersistedLocalData,
  restorePersistedReplica,
} from 'store/data'
import { getDataToSave } from '4-features/shared/getDataToSave'
import { parsePersistedReplica } from 'zerro-core/replica'
import {
  LOCAL_KEYS,
  getLocalData,
  getReplicaState,
  saveLocalData,
} from '6-shared/api/localStore'

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
  const [data, replica] = await Promise.all([getLocalData(), getReplicaState()])
  dispatch(applyServerPatch(data))
  dispatch(restorePersistedReplica(parseReplicaOrUndefined(replica)))
  return data
}

function parseReplicaOrUndefined(replica: unknown) {
  try {
    return parsePersistedReplica(replica)
  } catch (error) {
    console.warn('Ignoring invalid persisted Core replica', error)
    return undefined
  }
}

export const clearLocalData = (): AppThunk<Promise<void>> => () =>
  clearPersistedLocalData()
