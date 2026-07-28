import { getSyncCursor } from 'store/data/selectors'
import { getToken } from 'store/token'
import { saveDataLocally } from '4-features/localData'
import { track } from '6-shared/analytics'
import { syncFinished, syncStarted } from 'store/sync'
import { formatDate } from '6-shared/helpers/date'
import type { AppThunk } from 'store'
import type { TLocalData } from '6-shared/types'
import { sync } from '6-shared/api/syncDiff'
import {
  getPendingSyncTransport,
  applyServerPatch,
  prepareClientSync,
} from 'store/data'
import { keys } from '6-shared/helpers/keys'
import type { TNormalizedPatch } from '6-shared/types'
import { zmPreferenceStorage } from '6-shared/api/zmPreferenceStorage'

/** All syncs with zenmoney goes through this thunk */
export const syncData = (): AppThunk => async (dispatch, getState) => {
  dispatch(prepareClientSync())
  const state = getState()
  const sentOutboxCount = state.data.outbox.length
  const sentAt = Date.now()
  const diff: TNormalizedPatch = {
    ...(getPendingSyncTransport(state, sentAt) || {}),
    serverTimestamp: getSyncCursor(state),
  }
  const token = getToken(state) || ''

  dispatch(syncStarted())

  try {
    const response = await sync(token, zmPreferenceStorage.get(), diff)
    const result = {
      isSuccessful: !response.error,
      finishedAt: Date.now(),
      errorMessage: response.error || null,
    }

    if (response.data) {
      const data = response.data
      dispatch(applyServerPatch({ ...data, sentOutboxCount }))
      const changedDomains = getChangedDomains(data)
      dispatch(saveDataLocally(changedDomains))
      track('sync_completed', {
        mode: diff.serverTimestamp ? 'update' : 'first',
      })
      console.log(`✅ Data synced ${formatDate(new Date(), 'HH:mm:ss')}`)
    } else {
      console.warn('Syncing failed', response.error)
    }

    dispatch(syncFinished(result))
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    console.error('Syncing failed', error)
    dispatch(
      syncFinished({
        isSuccessful: false,
        finishedAt: Date.now(),
        errorMessage,
      })
    )
  }
}

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 500) || 'Unknown sync failure'
}

function getChangedDomains(data: TNormalizedPatch) {
  const domains: Set<keyof TLocalData> = new Set()
  keys(data).forEach(key => {
    if (key === 'deletion') data[key]?.forEach(item => domains.add(item.object))
    else domains.add(key)
  })
  return Array.from(domains)
}
