import { useAppSelector } from 'store/index'
import { checkRaw } from './filtering'
import { compareTrDates, getType, isViewed } from './helpers'
import { makeTransaction } from './makeTransaction'
import {
  getHistoryStart,
  getSortedTransactions,
  getTransactionsById,
  getTransactionsHistory,
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

export type { TransactionPatch } from './thunks'
export type { TrCondition } from './filtering'
export { TrType } from './helpers'

export const trModel = {
  // Selectors
  getTransactions: getTransactionsById,
  getSortedTransactions,
  getTransactionsHistory,
  getHistoryStart,

  // Hooks
  useTransactions: () => useAppSelector(getTransactionsById),
  useSortedTransactions: () => useAppSelector(getSortedTransactions),
  useTransactionsHistory: () => useAppSelector(getTransactionsHistory),

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
