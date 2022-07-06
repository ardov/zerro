import { v1 as uuidv1 } from 'uuid'
import { getTransaction, getTransactions } from 'models/transaction'
import { sendEvent } from 'shared/helpers/tracking'
import { AppThunk } from 'store'
import {
  OptionalExceptFor,
  TTagId,
  ITransaction,
  TTransactionId,
} from 'shared/types'
import { applyClientPatch } from 'store/data'

export const deleteTransactions =
  (ids: TTransactionId | TTransactionId[]): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Transaction: delete')
    const array = Array.isArray(ids) ? ids : [ids]
    const deleted = array.map(id => ({
      ...getTransaction(getState(), id),
      deleted: true,
      changed: Date.now(),
    }))
    dispatch(applyClientPatch({ transaction: deleted }))
  }

export const deleteTransactionsPermanently =
  (ids: TTransactionId | TTransactionId[]): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Transaction: delete permanently')
    const array = Array.isArray(ids) ? ids : [ids]
    const deleted = array.map(id => ({
      ...getTransaction(getState(), id),
      outcome: 0.00001,
      income: 0.00001,
      changed: Date.now(),
    }))
    dispatch(applyClientPatch({ transaction: deleted }))
  }

export const markViewed =
  (ids: TTransactionId | TTransactionId[], viewed: boolean): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent(`Transaction: mark viewed: ${viewed}`)
    const array = Array.isArray(ids) ? ids : [ids]
    const state = getState()
    const result = array.map(id => ({
      ...getTransaction(state, id),
      viewed,
      changed: Date.now(),
    }))
    dispatch(applyClientPatch({ transaction: result }))
  }

export const restoreTransaction =
  (id: TTransactionId): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Transaction: restore')
    const tr = {
      ...getTransaction(getState(), id),
      deleted: false,
      changed: Date.now(),
      id: uuidv1(),
    }
    dispatch(applyClientPatch({ transaction: [tr] }))
  }

// Не работает
// TODO: Надо для новых транзакций сразу проставлять категорию. Иначе они обратно схлопываются
export const splitTransfer =
  (id: TTransactionId): AppThunk<void> =>
  (dispatch, getState) => {
    const state = getState()
    const tr = getTransaction(state, id)
    const list = split(tr)
    if (list) dispatch(applyClientPatch({ transaction: list }))
  }

export type TransactionPatch = OptionalExceptFor<ITransaction, 'id'>
export const applyChangesToTransaction =
  (patch: TransactionPatch): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Transaction: edit')
    const tr = {
      ...getTransaction(getState(), patch.id),
      ...patch,
      changed: Date.now(),
    }
    dispatch(applyClientPatch({ transaction: [tr] }))
  }

export const recreateTransaction =
  (patch: TransactionPatch): AppThunk<string> =>
  (dispatch, getState) => {
    sendEvent('Transaction: recreate')
    const tr = getTransaction(getState(), patch.id)
    const oldTr = {
      ...tr,
      outcome: 0.00001,
      income: 0.00001,
      changed: Date.now(),
    }
    const newTr = {
      ...getTransaction(getState(), patch.id),
      ...patch,
      id: uuidv1(),
      changed: Date.now(),
    }
    dispatch(applyClientPatch({ transaction: [oldTr, newTr] }))
    return newTr.id
  }

export const bulkEditTransactions =
  (
    ids: TTransactionId[],
    opts: { tags?: TTagId[]; comment?: string }
  ): AppThunk<void> =>
  (dispatch, getState) => {
    sendEvent('Bulk Actions: set new tags')
    const state = getState()
    const allTransactions = getTransactions(state)

    const result = ids.map(id => {
      const tr = allTransactions[id]
      const tag = modifyTags(tr.tag, opts.tags)
      const comment = modifyComment(tr.comment, opts.comment)
      return { ...tr, tag, comment, changed: Date.now() }
    })
    dispatch(applyClientPatch({ transaction: result }))
  }

const modifyTags = (prevTags: string[] | null, newTags?: string[]) => {
  if (!newTags) return prevTags
  let result: TTagId[] = []
  const addId = (id: string) =>
    result.includes(id) || id === 'null' ? '' : result.push(id)
  newTags?.forEach(id => {
    if (id === 'mixed' && prevTags) prevTags.forEach(addId)
    else addId(id)
  })
  return result
}
const modifyComment = (prevComment: string | null, newComment?: string) => {
  if (!newComment) return prevComment
  return newComment.replaceAll('$&', prevComment || '')
}

function split(raw: ITransaction) {
  if (!(raw.income && raw.outcome)) return null
  const result: ITransaction[] = [
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
