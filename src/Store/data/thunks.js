import uuidv1 from 'uuid/v1'
import { getTransaction } from 'store/data/selectors/transaction'
import { setTransaction } from 'store/changed/transaction'

export const deleteTransactions = ids => (dispatch, getState) => {
  const state = getState()
  const trToDelete = Array.isArray(ids)
    ? ids.map(id => getTransaction(state, id))
    : [getTransaction(state, ids)]
  const deleted = trToDelete.map(tr => convertToDeleted(tr))
  dispatch(setTransaction(deleted))
}

export const restoreTransaction = id => (dispatch, getState) => {
  const state = getState()
  const tr = {
    ...getTransaction(state, id),
    deleted: false,
    changed: Math.floor(Date.now() / 1000),
    id: uuidv1(),
  }
  dispatch(setTransaction(tr))
}

export const splitTransfer = id => (dispatch, getState) => {
  const state = getState()
  const tr = getTransaction(state, id)
  dispatch(setTransaction(split(tr)))
}

export const applyChangesToTransaction = tr => (dispatch, getState) => {
  const state = getState()
  const changedTransaction = {
    ...getTransaction(state, tr.id),
    ...tr,
    changed: Date.now() / 1000,
  }
  dispatch(setTransaction(changedTransaction))
}

export const setMainTagToTransactions = (transactions, tagId) => (
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
      changed: Math.floor(Date.now() / 1000),
    }
  })
  dispatch(setTransaction(result))
}

function convertToDeleted(raw) {
  return {
    ...raw,
    deleted: true,
    changed: Math.floor(Date.now() / 1000),
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
      incomeBankID: null,
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
      outcomeBankID: null,
    },
  ]
  return result
}
