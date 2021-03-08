import { v1 as uuidv1 } from 'uuid'
import { getTransaction } from 'store/localData/transactions'
import { sendEvent } from 'helpers/tracking'
import { AppThunk } from 'store'
import { OptionalExceptFor, TagId, Transaction, TransactionId } from 'types'
import { applyLocalPatch } from 'store/dataSlice'

export const deleteTransactions = (
  ids: TransactionId | TransactionId[]
): AppThunk => (dispatch, getState) => {
  sendEvent('Transaction: delete')
  const array = Array.isArray(ids) ? ids : [ids]
  const deleted = array.map(id => ({
    ...getTransaction(getState(), id),
    deleted: true,
    changed: Date.now(),
  }))
  dispatch(applyLocalPatch({ transaction: deleted }))
}

export const restoreTransaction = (id: TransactionId): AppThunk => (
  dispatch,
  getState
) => {
  sendEvent('Transaction: restore')
  const tr = {
    ...getTransaction(getState(), id),
    deleted: false,
    changed: Date.now(),
    id: uuidv1(),
  }
  dispatch(applyLocalPatch({ transaction: [tr] }))
}

// Не работает
// TODO: Надо для новых транзакций сразу проставлять категорию. Иначе они обратно схлопываются
export const splitTransfer = (id: TransactionId): AppThunk => (
  dispatch,
  getState
) => {
  const state = getState()
  const tr = getTransaction(state, id)
  const list = split(tr)
  if (list) dispatch(applyLocalPatch({ transaction: list }))
}

type TransactionPatch = OptionalExceptFor<Transaction, 'id'>
export const applyChangesToTransaction = (
  patch: TransactionPatch
): AppThunk => (dispatch, getState) => {
  sendEvent('Transaction: edit')
  const tr = {
    ...getTransaction(getState(), patch.id),
    ...patch,
    changed: Date.now(),
  }
  dispatch(applyLocalPatch({ transaction: [tr] }))
}

export const setTagsToTransactions = (
  ids: TransactionId[],
  tags: TagId[]
): AppThunk => (dispatch, getState) => {
  sendEvent('Bulk Actions: set new tags')
  const state = getState()

  const result = ids.map(id => {
    const tr = getTransaction(state, id)
    const newTags: TagId[] = []
    const addId = (id: string) =>
      newTags.includes(id) || id === 'null' ? '' : newTags.push(id)
    tags?.forEach(id => {
      if (id === 'mixed' && tr.tag) tr.tag.forEach(addId)
      else addId(id)
    })
    return { ...tr, tag: newTags, changed: Date.now() }
  })
  dispatch(applyLocalPatch({ transaction: result }))
}

function split(raw: Transaction) {
  if (!(raw.income && raw.outcome)) return null
  const result: Transaction[] = [
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
