import { getLastSyncTime } from 'store/data/selectors'
import { getToken } from 'store/token'
import { setPending } from 'store/isPending'
import { saveDataLocally } from '4-features/localData'
import { track } from '6-shared/analytics'
import { setSyncData } from 'store/lastSync'
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
    serverTimestamp: getLastSyncTime(state),
  }
  const token = getToken(state) || ''

  dispatch(setPending(true))

  const response = await sync(token, zmPreferenceStorage.get(), diff)
  dispatch(
    setSyncData({
      isSuccessful: !response.error,
      finishedAt: Date.now(),
      errorMessage: response.error || null,
    })
  )

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
    console.warn('Syncing failed', response)
  }
  dispatch(setPending(false))
}

function getChangedDomains(data: TNormalizedPatch) {
  const domains: Set<keyof TLocalData> = new Set()
  keys(data).forEach(key => {
    if (key === 'deletion') data[key]?.forEach(item => domains.add(item.object))
    else domains.add(key)
  })
  return Array.from(domains)
}
