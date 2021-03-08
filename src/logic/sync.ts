import { getLastSyncTime } from 'store/serverData'
import { getToken } from 'store/token'
import { setPending } from 'store/isPending'
import { saveDataLocally } from 'logic/localData'
import { sendEvent } from 'helpers/tracking'
import { updateData } from 'store/commonActions'
import { setSyncData } from 'store/lastSync'
import { formatDate } from 'helpers/format'
import { AppThunk } from 'store'
import { Diff, LocalData } from 'types'
import { sync } from 'worker'
import { getDiff } from 'store/dataSlice'
import { keys } from 'helpers/keys'

/** All syncs with zenmoney goes through this thunk */
export const syncData = (): AppThunk => async (dispatch, getState) => {
  const state = getState()
  const diff: Diff = {
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
    dispatch(updateData({ data, syncStartTime }))
    const changedDomains = getChangedDomains(data)
    dispatch(saveDataLocally(changedDomains))
    console.log(`✅ Данные обновлены ${formatDate(new Date(), 'HH:mm:ss')}`)
  } else {
    console.warn('Syncing failed', response.error)
    sendEvent(`Error: ${response.error}`)
    // captureError(err)
  }
}

function getChangedDomains(data: Diff) {
  let domains: Set<keyof LocalData> = new Set()
  keys(data).forEach(key => {
    if (key === 'deletion') data[key]?.forEach(item => domains.add(item.object))
    else domains.add(key)
  })
  return Array.from(domains)
}
