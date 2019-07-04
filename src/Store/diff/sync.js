import ZenApi from 'services/ZenApi'
import { updateData } from 'store/data'
import LocalStorage from 'services/localstorage'
import { message } from 'antd'
import { getChangedArrays } from '.'
import { getToken } from 'store/token'
import { removeSynced } from './actions'

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

  return ZenApi.getData(token, { serverTimestamp, changed }).then(
    json => {
      dispatch(updateData(json))
      dispatch(removeSynced(syncBegin))
      LocalStorage.set('data', getState().data)
      if (Object.keys(json).length > 1) {
        message.success(successMessage)
      }
      console.log('✅ Данные обновлены', new Date())
    },
    err => {
      message.error(failMessage)
      console.warn('Syncing failed', err)
    }
  )
}
