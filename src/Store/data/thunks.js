import ZenApi from '../../services/ZenApi'
import { updateData } from './index'
import { addFakeTransaction, removeFakeTransaction } from '../fakeTransactions'
import LocalStorage from '../../services/localstorage'

//All syncs with ZM goes through this thunk
export const syncData = changed => (dispatch, getState) => {
  const state = getState()
  const lastSync = state.data.lastSync
  return ZenApi.getData(state.token, { lastSync, changed }).then(
    json => {
      dispatch(updateData(json))
      LocalStorage.set('data', getState().data)
    },
    err => console.warn('!!!', err)
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
