export {
  applyChangesToTransaction as update,
  bulkEditTransactions as bulkEdit,
  combineTransactionsToIncome as combineToIncome,
  combineTransactionsToOutcome as combineToOutcome,
  deleteTransactions as remove,
  deleteTransactionsPermanently as removePermanently,
  mergeTransactionsAsTransfer as mergeAsTransfer,
  recreateTransaction as recreate,
  restoreTransaction as restore,
  setTransactionsViewed as setViewed,
} from './commands'
import { useCallback } from 'react'
import { useAppSelector } from 'store'
import type { RootState } from 'store'
import { getTransactionType, getTransactions } from '../domain/zenmoney'
import { graph } from './graph'
import { selectTransactionSlice } from './state'
import * as accounts from './accounts'

export const selectAll = (state: RootState) =>
  getTransactions({ transaction: selectTransactionSlice(state) })
export const selectIds = (state: RootState) =>
  graph.transactionIds(state.data.current)
export const selectHistory = (state: RootState) =>
  graph.transactionsHistory(state.data.current)
export const selectHistoryStart = (state: RootState) =>
  graph.historyStart(state.data.current)
export const useType = () => {
  const debtAccountId = useAppSelector(accounts.selectDebtAccountId)
  return useCallback(
    (transaction: Parameters<typeof getTransactionType>[0]) =>
      getTransactionType(transaction, debtAccountId),
    [debtAccountId]
  )
}
export {
  compareTransactionDates,
  getTransactionType as getType,
  isTransactionViewed as isViewed,
  TrType,
} from '../domain/zenmoney'
export {
  compileTransactionQuery as compileQuery,
  TrFilterMode,
  TrFilterType,
  type TTransactionFilterClause,
  type TTransactionQuery,
  type TTransactionQueryContext,
} from '../domain/zerro'
