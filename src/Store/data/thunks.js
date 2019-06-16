import ZenApi from '../../services/ZenApi'
import { updateData } from './index'
import { addFakeTransaction, removeFakeTransaction } from '../fakeTransactions'
import LocalStorage from '../../services/localstorage'
import { message } from 'antd'
import uuidv1 from 'uuid/v1'

//All syncs with ZM goes through this thunk
export const syncData = (changed, messages = {}) => (dispatch, getState) => {
  const processMessage = messages.process || 'Синхронизируемся...'
  const successMessage = messages.success || 'Готово!'
  const failMessage = messages.fail || 'Что-то пошло не так'

  message.loading(processMessage, 0)

  const state = getState()
  const serverTimestamp = state.data.serverTimestamp || 0
  return ZenApi.getData(state.token, { serverTimestamp, changed }).then(
    json => {
      dispatch(updateData(json))
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

export const deleteTransactions = ids => (dispatch, getState) => {
  const raws = getState().data.transaction
  const messages = {
    process: 'Удаляем транзакцию...'
  }
  const idsToDelete = Array.isArray(ids) ? ids : [ids]
  const deleted = idsToDelete.map(id => convertToDeleted(raws[id]))

  // dispatch(addFakeTransaction(changedTransaction))
  const changed = { transaction: deleted }
  dispatch(syncData(changed, messages))
  // .finally(() =>dispatch(removeFakeTransaction(ids)))
}

export const restoreTransaction = id => (dispatch, getState) => {
  const transaction = getState().data.transaction
  const changed = {
    transaction: [
      {
        ...transaction[id],
        deleted: false,
        changed: Math.floor(Date.now() / 1000),
        id: uuidv1()
      }
    ]
  }

  dispatch(syncData(changed))
}

export const splitTransfer = id => (dispatch, getState) => {
  const transaction = getState().data.transaction
  const changed = {
    transaction: split(transaction[id])
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

export const setMainTagToTransactions = (transactions, tagId) => (
  dispatch,
  getState
) => {
  const messages = { process: 'Добавляем категории...' }

  const raws = getState().data.transaction
  const result = transactions.map(id => {
    const tr = raws[id]
    const newTags = tr.tag ? [tagId, ...tr.tag] : [tagId]
    return {
      ...tr,
      tag: newTags,
      changed: Math.floor(Date.now() / 1000)
    }
  })

  dispatch(syncData({ transaction: result }, messages))
}

function convertToDeleted(raw) {
  return {
    ...raw,
    deleted: true,
    changed: Math.floor(Date.now() / 1000)
  }
}

// function setTags(raw, tags) {
//   return {
//     ...raw,
//     tag: tags,
//     changed: Math.floor(Date.now() / 1000)
//   }
// }

// function addMainTag(raw, tag) {
//   const newTags = raw.tag ? [tag, ...raw.tag] : [tag]
//   return {
//     ...raw,
//     tag: newTags,
//     changed: Math.floor(Date.now() / 1000)
//   }
// }

function split(raw) {
  if (!(raw.income && raw.outcome)) return null
  const result = [
    {
      ...raw,
      changed: Math.floor(Date.now() / 1000),
      income: 0,
      incomeInstrument: raw.outcomeInstrument,
      incomeAccount: raw.outcomeAccount,
      opIncome: null,
      opIncomeInstrument: null,
      incomeBankID: null
    },
    {
      ...raw,
      changed: Math.floor(Date.now() / 1000),
      id: uuidv1(),
      outcome: 0,
      outcomeInstrument: raw.incomeInstrument,
      outcomeAccount: raw.incomeAccount,
      opOutcome: null,
      opOutcomeInstrument: null,
      outcomeBankID: null
    }
  ]
  // console.table(result)
  return result
}
