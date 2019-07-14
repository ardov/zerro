import ZenApi from 'services/ZenApi'
import { updateData } from 'store/data/commonActions'
import { message } from 'antd'
import { getChangedArrays } from '../store/data/dataSelectors'
import { getToken } from 'store/token'
import { removeSynced } from '../store/data/commonActions'
import { setPending } from 'store/isPending'
import { saveDataLocally } from 'logic/localData'
import { getServerTimestampToSave } from 'store/data/serverTimestamp'

//All syncs with ZM goes through this thunk
export const syncData = () => (dispatch, getState) => {
  const state = getState()
  const changed = getChangedArrays(state)
  const token = getToken(state)
  const serverTimestamp = getServerTimestampToSave(state) || 0

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
      dispatch(saveDataLocally())
      if (Object.keys(json).length > 1) {
        message.success(successMessage)
      }
      console.log('✅ Данные обновлены', new Date())
    },
    err => {
      dispatch(setPending(false))
      message.error(failMessage)
      console.warn('Syncing failed', err)
    }
  )
}
