import ZenApi from '../../services/ZenApi'
import { updateData } from './actions'
import {
  addFakeTransaction,
  removeFakeTransaction
} from '../fakeTransactions/actions'

export const loadData = changed => (dispatch, getState) => {
  const { token, data } = getState()
  const lastSync = data.lastSync
  ZenApi.getData(token, { lastSync, changed })
    .then(json => dispatch(updateData(json)))
    .catch(err => console.warn('!!!', err))
}

export const deleteTransaction = id => (dispatch, getState) => {
  const { token, lastSync, transaction } = getState()
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
  const { token, lastSync, transaction } = getState()
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
  const { token, lastSync, transaction } = getState()
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
