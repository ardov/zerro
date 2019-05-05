import ZenApi from '../../services/ZenApi'
import { updateData } from './actions'
import { addFakeTransaction, removeFakeTransaction } from '../fakeTransactions'
import LocalStorage from '../../services/localstorage'

export const loadData = changed => (dispatch, getState) => {
  const state = getState()
  const lastSync = state.data.lastSync
  ZenApi.getData(state.token, { lastSync, changed })
    .then(json => {
      dispatch(updateData(json))
      LocalStorage.set('data', getState().data)
    })
    .catch(err => console.warn('!!!', err))
}

export const deleteTransaction = id => (dispatch, getState) => {
  const { token, data } = getState()
  const { lastSync, transaction } = data
  const changedTransaction = {
    ...transaction[id],
    deleted: true,
    changed: Date.now() / 1000
  }
  dispatch(addFakeTransaction(changedTransaction))
  const changed = {
    transaction: [changedTransaction]
  }
  ZenApi.getData(token, { lastSync, changed })
    .then(json => dispatch(updateData(json)))
    .catch(err => console.warn('!!!', err))
    .finally(() => dispatch(removeFakeTransaction(changedTransaction.id)))
}

export const restoreTransaction = id => (dispatch, getState) => {
  const { token, data } = getState()
  const { lastSync, transaction } = data
  const changed = {
    transaction: [
      {
        ...transaction[id],
        deleted: false,
        changed: Date.now() / 1000
      }
    ]
  }
  ZenApi.getData(token, { lastSync, changed })
    .then(json => dispatch(updateData(json)))
    .catch(err => console.warn('!!!', err))
}

export const applyChangesToTransaction = tr => (dispatch, getState) => {
  const { token, data } = getState()
  const { lastSync, transaction } = data
  const changedTransaction = {
    ...transaction[tr.id],
    ...tr,
    changed: Date.now() / 1000
  }
  dispatch(addFakeTransaction(changedTransaction))
  const changed = { transaction: [changedTransaction] }

  ZenApi.getData(token, { lastSync, changed })
    .then(json => dispatch(updateData(json)))
    .catch(err => console.warn('!!!', err))
    .finally(() => dispatch(removeFakeTransaction(changedTransaction.id)))
}
