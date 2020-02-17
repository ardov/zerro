import ZenApi from 'services/ZenApi'
import { getLastSyncTime } from 'store/serverData'
import { getChangedArrays } from 'store/localData'
import { getToken } from 'store/token'
import { setPending } from 'store/isPending'
import { saveDataLocally } from 'logic/localData'
import { setMessage } from 'store/message'
import sendEvent from 'helpers/sendEvent'
import * as Sentry from '@sentry/browser'
import { updateData } from 'store/commonActions'

//All syncs with ZM goes through this thunk
export const syncData = () => (dispatch, getState) => {
  const state = getState()
  const changed = getChangedArrays(state)
  const token = getToken(state)
  const serverTimestamp = getLastSyncTime(state) / 1000 || 0

  // MESSAGES
  const successMessage = 'Данные обновлены'
  const failMessage = 'Синхронизация не удалась'

  const syncStartTime = Date.now()
  dispatch(setPending(true))

  return ZenApi.getData(token, { serverTimestamp, changed }).then(
    data => {
      sendEvent(
        `Sync: ${serverTimestamp ? 'Successful update' : 'Successful first'}`
      )
      dispatch(setPending(false))
      dispatch(updateData({ data, syncStartTime }))

      // Тут точно надо по-нормальному формировать список изменённых
      // объектов, чтобы без дублирования и deletion туда не попадал
      const deletionDomains = data.deletion
        ? data.deletion.reduce((obj, item) => {
            obj[item.object] = 1
            return obj
          }, {})
        : {}

      const changedDomains = [
        ...Object.keys(data),
        ...Object.keys(deletionDomains),
      ]
      dispatch(saveDataLocally(changedDomains))

      if (changedDomains.length > 1) {
        dispatch(setMessage(successMessage))
      }
      console.log('✅ Данные обновлены', new Date())
    },
    err => {
      dispatch(setPending(false))
      dispatch(setMessage(failMessage))

      console.warn('Syncing failed', err)
      sendEvent(`Error: ${err.message}`)
      if (process.env.NODE_ENV === 'production') {
        Sentry.captureException(err)
      }
    }
  )
}
