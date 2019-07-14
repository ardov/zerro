import uuidv1 from 'uuid/v1'
import { getTransaction } from 'store/data/transactions'
import { setTransaction } from 'store/data/transactions'

const deleteTransactions = ids => (dispatch, getState) => {
  const state = getState()
  const trToDelete = Array.isArray(ids)
    ? ids.map(id => getTransaction(state, id))
    : [getTransaction(state, ids)]
  const deleted = trToDelete.map(tr => convertToDeleted(tr))
  dispatch(setTransaction(deleted))
}

const restoreTransaction = id => (dispatch, getState) => {
  const state = getState()
  const tr = {
    ...getTransaction(state, id),
    deleted: false,
    changed: Date.now(),
    id: uuidv1(),
  }
  dispatch(setTransaction(tr))
}

const splitTransfer = id => (dispatch, getState) => {
  const state = getState()
  const tr = getTransaction(state, id)
  dispatch(setTransaction(split(tr)))
}

const applyChangesToTransaction = tr => (dispatch, getState) => {
  const state = getState()
  const changedTransaction = {
    ...getTransaction(state, tr.id),
    ...tr,
    changed: Date.now(),
  }
  dispatch(setTransaction(changedTransaction))
}

const setMainTagToTransactions = (transactions, tagId) => (
  dispatch,
  getState
) => {
  const state = getState()
  const result = transactions.map(id => {
    const tr = getTransaction(state, id)
    const newTags = tr.tag ? [tagId, ...tr.tag] : [tagId]
    return {
      ...tr,
      tag: newTags,
      changed: Date.now(),
    }
  })
  dispatch(setTransaction(result))
}

export default {
  deleteTransactions,
  restoreTransaction,
  splitTransfer,
  applyChangesToTransaction,
  setMainTagToTransactions,
}

function convertToDeleted(raw) {
  return {
    ...raw,
    deleted: true,
    changed: Date.now(),
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
      changed: Date.now(),
      income: 0,
      incomeInstrument: raw.outcomeInstrument,
      incomeAccount: raw.outcomeAccount,
      opIncome: null,
      opIncomeInstrument: null,
      incomeBankID: null,
    },
    {
      ...raw,
      changed: Date.now(),
      id: uuidv1(),
      outcome: 0,
      outcomeInstrument: raw.incomeInstrument,
      outcomeAccount: raw.incomeAccount,
      opOutcome: null,
      opOutcomeInstrument: null,
      outcomeBankID: null,
    },
  ]
  return result
}
