import { sendEvent } from '6-shared/helpers/tracking'
import { AppThunk } from 'store'
import {
  OptionalExceptFor,
  TTagId,
  TTransaction,
  TTransactionId,
} from '6-shared/types'
import {
  applyChangesToTransaction as applyChangesToTransactionCommand,
  bulkEditTransactions as bulkEditTransactionsCommand,
  deleteTransactions as deleteTransactionsCommand,
  deleteTransactionsPermanently as deleteTransactionsPermanentlyCommand,
  recreateTransaction as recreateTransactionCommand,
  restoreTransaction as restoreTransactionCommand,
  setTransactionsViewed,
} from 'core-next/adapters/redux'

export type TransactionPatch = OptionalExceptFor<TTransaction, 'id'>

export const deleteTransactions =
  (ids: TTransactionId | TTransactionId[]): AppThunk<void> =>
  dispatch => {
    sendEvent('Transaction: delete')
    dispatch(deleteTransactionsCommand(Array.isArray(ids) ? ids : [ids]))
  }

export const deleteTransactionsPermanently =
  (ids: TTransactionId | TTransactionId[]): AppThunk<void> =>
  dispatch => {
    sendEvent('Transaction: delete permanently')
    dispatch(
      deleteTransactionsPermanentlyCommand(Array.isArray(ids) ? ids : [ids])
    )
  }

export const markViewed =
  (ids: TTransactionId | TTransactionId[], viewed: boolean): AppThunk<void> =>
  dispatch => {
    sendEvent(`Transaction: mark viewed: ${viewed}`)
    dispatch(setTransactionsViewed(Array.isArray(ids) ? ids : [ids], viewed))
  }

export const restoreTransaction =
  (id: TTransactionId): AppThunk<void> =>
  dispatch => {
    sendEvent('Transaction: restore')
    dispatch(restoreTransactionCommand(id))
  }

export const applyChangesToTransaction =
  (patch: TransactionPatch): AppThunk<void> =>
  dispatch => {
    sendEvent('Transaction: edit')
    dispatch(applyChangesToTransactionCommand(patch))
  }

export const recreateTransaction =
  (patch: TransactionPatch): AppThunk<string> =>
  dispatch => {
    sendEvent('Transaction: recreate')
    return dispatch(recreateTransactionCommand(patch))
  }

export const bulkEditTransactions =
  (
    ids: TTransactionId[],
    opts: { tags?: TTagId[]; comment?: string }
  ): AppThunk<void> =>
  dispatch => {
    sendEvent('Bulk Actions: set new tags')
    dispatch(bulkEditTransactionsCommand(ids, opts))
  }
