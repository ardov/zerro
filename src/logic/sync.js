import ZenApi from 'services/ZenApi'
import { updateData } from 'store/data'
import { message } from 'antd'
import { getChangedArrays } from '../store/diff'
import { getToken } from 'store/token'
import { removeSynced } from '../store/diff/actions'
import { setPending } from 'store/isPending'
import { saveDataLocally } from 'logic/localData'

//All syncs with ZM goes through this thunk
export const syncData = () => (dispatch, getState) => {
  const state = getState()
  const changed = getChangedArrays(state)
  const token = getToken(state)
  const serverTimestamp = state.data.serverTimestamp || 0

  // MESSAGES
  const successMessage = 'Данные обновлены'
  const failMessage = 'Синхронизация не удалась'

  const syncBegin = Date.now() / 1000
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
