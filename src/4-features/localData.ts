import type { AppThunk } from 'store'
import {
  applyServerPatch,
  clearPersistedLocalData,
  restorePersistedJournal,
  restorePersistedReplica,
} from 'store/data'
import { getDataToSave } from '4-features/shared/getDataToSave'
import {
  parsePersistedJournal,
  parsePersistedReplica,
} from 'zerro-core/replica'
import {
  LOCAL_KEYS,
  getLocalData,
  getJournalState,
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
  const [data, replica, journal] = await Promise.all([
    getLocalData(),
    getReplicaState(),
    getJournalState(),
  ])
  dispatch(applyServerPatch(data))
  dispatch(restorePersistedJournal(parseJournalOrFallback(journal)))
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

function parseJournalOrFallback(journal: unknown) {
  if (journal === undefined || journal === null) {
    return { preserveStored: false }
  }

  try {
    return { journal: parsePersistedJournal(journal), preserveStored: false }
  } catch (error) {
    console.warn('Ignoring invalid persisted Core journal', error)
    return { preserveStored: true }
  }
}

export const clearLocalData = (): AppThunk<Promise<void>> => () =>
  clearPersistedLocalData()
