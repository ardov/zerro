import { useAppSelector } from 'store/index'
import { checkRaw } from './filtering'
import { compareTrDates, getType, isViewed } from './helpers'
import { makeTransaction } from './makeTransaction'
import {
  getHistoryStart,
  getTransactionsById,
  getTransactionsHistory,
  getTransactionIds,
  getTrTypeGetter,
} from './model'
export type { TrCondition } from './filtering'
export { TrType } from './helpers'

export const trModel = {
  // Selectors. Reads are migrated to Core Next; these stay as the reference
  // implementation for parity tests and for the not-yet-migrated write thunks.
  /** @deprecated Read via `selectCoreTransactions` from `core-next/adapters/redux` */
  getTransactionsById,
  /** @deprecated Read via `selectCoreTransactionsHistory` from `core-next/adapters/redux` */
  getTransactionsHistory,
  /** @deprecated Read via `selectCoreHistoryStart` from `core-next/adapters/redux` */
  getHistoryStart,
  /** @deprecated Read via `selectCoreTransactionIds` from `core-next/adapters/redux` */
  getTransactionIds,

  // Helper hooks
  useTrTypeGetter: () => useAppSelector(getTrTypeGetter),

  // Helpers
  compareTrDates,
  makeTransaction,
  getType,
  isViewed,

  //Filtering
  checkRaw,
}
