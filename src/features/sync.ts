import { getLastSyncTime } from 'store/data/selectors'
import { getToken } from 'store/token'
import { setPending } from 'store/isPending'
import { saveDataLocally } from 'features/localData'
import { sendEvent } from 'shared/helpers/tracking'
import { setSyncData } from 'store/lastSync'
import { formatDate } from 'shared/helpers/date'
import { AppThunk } from 'store'
import { TLocalData } from 'shared/types'
import { sync } from 'worker'
import { getDiff, applyServerPatch } from 'store/data'
import { keys } from 'shared/helpers/keys'
import { IDiff } from 'shared/types'

/** All syncs with zenmoney goes through this thunk */
export const syncData = (): AppThunk => async (dispatch, getState) => {
  const state = getState()
  const diff: IDiff = {
    ...(getDiff(state) || {}),
    serverTimestamp: getLastSyncTime(state),
  }
  const token = getToken(state) || ''

  const syncStartTime = Date.now()
  dispatch(setPending(true))

  const response = await sync(token, diff)
  dispatch(setPending(false))
  dispatch(
    setSyncData({
      isSuccessful: !response.error,
      finishedAt: Date.now(),
      errorMessage: response.error || null,
    })
  )

  if (response.data) {
    if (diff.serverTimestamp) sendEvent(`Sync: Successful update`)
    else sendEvent(`Sync: Successful first`)

    const data = response.data
    dispatch(applyServerPatch({ ...data, syncStartTime }))
    const changedDomains = getChangedDomains(data)
    dispatch(saveDataLocally(changedDomains))
    console.log(`✅ Данные обновлены ${formatDate(new Date(), 'HH:mm:ss')}`)
  } else {
    console.warn('Syncing failed', response)
    sendEvent(`Error: ${response.error}`)
    // captureError(err)
  }
}

function getChangedDomains(data: IDiff) {
  let domains: Set<keyof TLocalData> = new Set()
  keys(data).forEach(key => {
    if (key === 'deletion') data[key]?.forEach(item => domains.add(item.object))
    else domains.add(key)
  })
  return Array.from(domains)
}
