import ZenApi from '../../services/ZenApi'
import { updateData } from './index'
import { addFakeTransaction, removeFakeTransaction } from '../fakeTransactions'
import LocalStorage from '../../services/localstorage'
import { message } from 'antd'

//All syncs with ZM goes through this thunk
export const syncData = changed => (dispatch, getState) => {
  message.loading('Синхронизируемся...', 0)

  const state = getState()
  const serverTimestamp = state.data.serverTimestamp || 0
  return ZenApi.getData(state.token, { serverTimestamp, changed }).then(
    json => {
      dispatch(updateData(json))
      LocalStorage.set('data', getState().data)
      message.destroy()
      message.success('Готово!')
    },
    err => {
      message.destroy()
      message.error('Что-то пошло не так')
      console.warn('Syncing failed', err)
    }
  )
}

export const deleteTransaction = id => (dispatch, getState) => {
  const transaction = getState().data.transaction
  const changedTransaction = {
    ...transaction[id],
    deleted: true,
    changed: Date.now() / 1000
  }
  dispatch(addFakeTransaction(changedTransaction))
  const changed = { transaction: [changedTransaction] }
  dispatch(syncData(changed)).finally(() => dispatch(removeFakeTransaction(id)))
}

export const restoreTransaction = id => (dispatch, getState) => {
  const transaction = getState().data.transaction
  const changed = {
    transaction: [
      {
        ...transaction[id],
        deleted: false,
        changed: Date.now() / 1000
      }
    ]
  }
  dispatch(syncData(changed))
}

export const applyChangesToTransaction = tr => (dispatch, getState) => {
  const transaction = getState().data.transaction
  const changedTransaction = {
    ...transaction[tr.id],
    ...tr,
    changed: Date.now() / 1000
  }
  dispatch(addFakeTransaction(changedTransaction))
  dispatch(syncData({ transaction: [changedTransaction] })).finally(() =>
    dispatch(removeFakeTransaction(changedTransaction.id))
  )
}
