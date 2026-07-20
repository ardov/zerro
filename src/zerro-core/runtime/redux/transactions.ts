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
import {
  getTransactionType,
  getTransactions,
} from '../../internal/domain/zenmoney/entities/transactions'
import { fromGraph, graph } from './graph'
import { selectTransactionSlice } from './state'
import * as accounts from './accounts'

export const selectAll = (state: RootState) =>
  getTransactions({ transaction: selectTransactionSlice(state) })
export const selectIds = fromGraph(graph.transactionIds)
export const selectHistory = fromGraph(graph.transactionsHistory)
export const selectHistoryStart = fromGraph(graph.historyStart)
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
} from '../../internal/domain/zenmoney/entities/transactions'
export {
  compileTransactionQuery as compileQuery,
  TrFilterMode,
  TrFilterType,
  type TTransactionFilterClause,
  type TTransactionQuery,
  type TTransactionQueryContext,
} from '../../internal/domain/zerro'
