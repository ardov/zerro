import ZenApi from 'services/ZenApi'
import { getLastSyncTime } from 'store/serverData'
import { getChangedArrays } from 'store/localData'
import { getToken } from 'store/token'
import { setPending } from 'store/isPending'
import { saveDataLocally } from 'logic/localData'
import { captureError, sendEvent } from 'helpers/tracking'
import { updateData } from 'store/commonActions'
import { setSyncData } from 'store/lastSync'
import { formatDate } from 'helpers/format'
import { AppThunk } from 'store'
import { ZmResponse, LocalData } from 'types'

/** All syncs with zenmoney goes through this thunk */
export const syncData = (): AppThunk => (dispatch, getState) => {
  const state = getState()
  const changed = getChangedArrays(state)
  const token = getToken(state) || ''
  const serverTimestamp = getLastSyncTime(state) / 1000 || 0

  const syncStartTime = Date.now()
  dispatch(setPending(true))

  return ZenApi.getData(token, { serverTimestamp, changed }).then(
    data => {
      sendEvent(
        `Sync: ${serverTimestamp ? 'Successful update' : 'Successful first'}`
      )
      dispatch(setPending(false))
      dispatch(
        setSyncData({
          isSuccessful: true,
          finishedAt: Date.now(),
          errorMessage: null,
        })
      )
      dispatch(updateData({ data, syncStartTime }))

      const changedDomains = getChangedDomains(data)
      dispatch(saveDataLocally(changedDomains))

      console.log(`✅ Данные обновлены ${formatDate(new Date(), 'HH:mm:ss')}`)
    },
    err => {
      dispatch(setPending(false))
      dispatch(
        setSyncData({
          isSuccessful: false,
          finishedAt: Date.now(),
          errorMessage: err?.message,
        })
      )

      console.warn('Syncing failed', err)
      sendEvent(`Error: ${err.message}`)
      captureError(err)
    }
  )
}
type LocalKey = keyof LocalData
const domains: LocalKey[] = [
  'serverTimestamp',
  'instrument',
  'company',
  'user',
  'account',
  'tag',
  'merchant',
  'budget',
  'reminder',
  'reminderMarker',
  'transaction',
]

function getChangedDomains(data: ZmResponse) {
  let changedDomains: LocalKey[] = []
  function add(key: LocalKey) {
    if (changedDomains.includes(key)) return
    changedDomains.push(key)
  }
  domains.forEach(key => {
    if (data[key]) add(key)
  })
  if (data.deletion) data.deletion.forEach(item => add(item.object))
  return changedDomains
}
