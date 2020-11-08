import { v1 as uuidv1 } from 'uuid'
import { getTransaction } from 'store/localData/transactions'
import { setTransaction } from 'store/localData/transactions'
import { sendEvent } from 'helpers/tracking'

export const deleteTransactions = ids => (dispatch, getState) => {
  sendEvent('Transaction: delete')
  const array = ids.map ? ids : [ids]
  const deleted = array.map(id => ({
    ...getTransaction(getState(), id),
    deleted: true,
    changed: Date.now(),
  }))
  dispatch(setTransaction(deleted))
}

export const restoreTransaction = id => (dispatch, getState) => {
  sendEvent('Transaction: restore')
  dispatch(
    setTransaction({
      ...getTransaction(getState(), id),
      deleted: false,
      changed: Date.now(),
      id: uuidv1(),
    })
  )
}

// Не работает
// TODO: Надо для новых транзакций сразу проставлять категорию. Иначе они обратно схлопываются
export const splitTransfer = id => (dispatch, getState) => {
  const state = getState()
  const tr = getTransaction(state, id)
  dispatch(setTransaction(split(tr)))
}

export const applyChangesToTransaction = tr => (dispatch, getState) => {
  sendEvent('Transaction: edit')
  dispatch(
    setTransaction({
      ...getTransaction(getState(), tr.id),
      ...tr,
      changed: Date.now(),
    })
  )
}

export const setMainTagToTransactions = (transactions, tagId) => (
  dispatch,
  getState
) => {
  sendEvent('Bulk Actions: set main tag')
  const state = getState()
  const result = transactions.map(id => {
    const tr = getTransaction(state, id)
    const newTags = tr.tag ? [tagId, ...tr.tag.splice(1)] : [tagId]
    return {
      ...tr,
      tag: newTags,
      changed: Date.now(),
    }
  })
  dispatch(setTransaction(result))
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
