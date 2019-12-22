import ZenApi from 'services/ZenApi'
import { updateData, getLastSyncTime } from 'store/data/serverData'
import { getChangedArrays } from '../store/data/dataSelectors'
import { getToken } from 'store/token'
import { removeSynced } from '../store/data/commonActions'
import { setPending } from 'store/isPending'
import { saveDataLocally } from 'logic/localData'
import { setMessage } from 'store/message'

//All syncs with ZM goes through this thunk
export const syncData = () => (dispatch, getState) => {
  const state = getState()
  const changed = getChangedArrays(state)
  const token = getToken(state)
  const serverTimestamp = getLastSyncTime(state) / 1000 || 0

  // MESSAGES
  const successMessage = 'Данные обновлены'
  const failMessage = 'Синхронизация не удалась'

  const syncBegin = Date.now()
  dispatch(setPending(true))

  return ZenApi.getData(token, { serverTimestamp, changed }).then(
    json => {
      dispatch(setPending(false))
      dispatch(updateData(json))
      dispatch(removeSynced(syncBegin))

      // Тут точно надо по-нормальному формировать список изменённых
      // объектов, чтобы без дублирования и deletion туда не попадал
      const deletionDomains = json.deletion
        ? json.deletion.reduce((obj, item) => {
            obj[item.object] = 1
            return obj
          }, {})
        : {}

      const changedDomains = [
        ...Object.keys(json),
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
    }
  )
}
