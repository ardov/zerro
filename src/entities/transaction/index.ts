import { useAppSelector } from '@store/index'
import { checkRaw } from './filtering'
import { compareTrDates, getType } from './helpers'
import { makeTransaction } from './makeTransaction'
import {
  getHistoryStart,
  getSortedTransactions,
  getTransactions,
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
export type { TrCondition, TrConditions } from './filtering'
export { TrType } from './helpers'

export const trModel = {
  // Selectors
  getTransactions,
  getSortedTransactions,
  getTransactionsHistory,
  getHistoryStart,

  // Hooks
  useTransactions: () => useAppSelector(getTransactions),
  useSortedTransactions: () => useAppSelector(getSortedTransactions),
  useTransactionsHistory: () => useAppSelector(getTransactionsHistory),

  // Helpers
  compareTrDates,
  makeTransaction,
  getType,

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
