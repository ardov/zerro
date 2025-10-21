import { useAppSelector } from 'store/index'
import { checkRaw } from './filtering'
import { compareTrDates, getType, isViewed } from './helpers'
import { makeTransaction } from './makeTransaction'
import {
  getHistoryStart,
  getTransactionsById,
  getTransaction,
  getTransactionsHistory,
  getTransactionIds,
  getTrTypeGetter,
} from './model'
import {
  deleteTransactions,
  deleteTransactionsPermanently,
  markViewed,
  restoreTransaction,
  splitTransfer,
  applyChangesToTransaction,
  recreateTransaction,
  bulkEditTransactions,
} from './thunks'
import { TTransactionId } from '6-shared/types'

export type { TransactionPatch } from './thunks'
export type { TrCondition } from './filtering'
export { TrType } from './helpers'

export const trModel = {
  // Existing selectors (for backward compatibility)
  getTransactionsById,
  getTransactionsHistory,
  getHistoryStart,

  // New ID-based selectors
  getTransactionIds,
  // getTransaction,

  // Existing hooks (for backward compatibility)
  useTransactions: () => useAppSelector(getTransactionsById),
  useTransactionsHistory: () => useAppSelector(getTransactionsHistory),

  // New ID-based hooks
  useSortedTransactionIds: () => useAppSelector(getTransactionIds),
  useTransaction: (id: TTransactionId) =>
    useAppSelector(state => getTransaction(state, id)),

  // Helper hooks
  useTrTypeGetter: () => useAppSelector(getTrTypeGetter),

  // Helpers
  compareTrDates,
  makeTransaction,
  getType,
  isViewed,

  //Filtering
  checkRaw,

  // Thunks
  deleteTransactions,
  deleteTransactionsPermanently,
  markViewed,
  restoreTransaction,
  splitTransfer,
  applyChangesToTransaction,
  recreateTransaction,
  bulkEditTransactions,
}
