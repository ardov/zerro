import ZenApi from 'services/ZenApi'
import { updateData } from 'store/data'
import LocalStorage from 'services/localstorage'
import { message } from 'antd'
import { getChangedArrays } from '.'
import { getToken } from 'store/token'
import { removeSynced } from './actions'

//All syncs with ZM goes through this thunk
export const syncData = (changed, messages = {}) => (dispatch, getState) => {
  const state = getState()
  const changed = getChangedArrays(state)
  const token = getToken(state)
  const serverTimestamp = state.data.serverTimestamp || 0

  // MESSAGES
  const processMessage = messages.process || 'Синхронизируемся...'
  const successMessage = messages.success || 'Готово!'
  const failMessage = messages.fail || 'Что-то пошло не так'

  const syncBegin = Date.now() / 1000

  message.loading(processMessage, 0)

  return ZenApi.getData(token, { serverTimestamp, changed }).then(
    json => {
      dispatch(updateData(json))
      dispatch(removeSynced(syncBegin))
      LocalStorage.set('data', getState().data)
      message.destroy()
      message.success(successMessage)
    },
    err => {
      message.destroy()
      message.error(failMessage)
      console.warn('Syncing failed', err)
    }
  )
}
