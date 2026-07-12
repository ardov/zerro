import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TAccountId } from '../accounts'
import type { TTransaction, TTransactionId } from './types'

export enum TrType {
  Income = 'income',
  Outcome = 'outcome',
  Transfer = 'transfer',
  IncomeDebt = 'incomeDebt',
  OutcomeDebt = 'outcomeDebt',
}

export type TTransactionSource = Pick<TDataStore, 'transaction'>

export function getTransactions(data: TTransactionSource): ById<TTransaction> {
  return data.transaction
}

export function getTransaction(
  data: TTransactionSource,
  id: TTransactionId
): TTransaction | null {
  return getTransactions(data)[id] || null
}

/**
 * Every transaction id in legacy list order, including soft-deleted entries.
 * UI filtering decides whether deleted rows are visible.
 */
export function getTransactionIds(data: TTransactionSource): TTransactionId[] {
  return Object.values(getTransactions(data))
    .sort(compareTransactionDates)
    .reverse()
    .map(transaction => transaction.id)
}

export function getTransactionsHistory(
  data: TTransactionSource
): TTransaction[] {
  return Object.values(getTransactions(data))
    .filter(transaction => !isDeletedTransaction(transaction))
    .sort(compareTransactionDates)
    .reverse()
}

export function compareTransactionDates(
  transactionA: TTransaction,
  transactionB: TTransaction
) {
  if (transactionA.date < transactionB.date) return 1
  if (transactionA.date > transactionB.date) return -1
  return transactionB.created - transactionA.created
}

export function isDeletedTransaction(transaction: TTransaction): boolean {
  if (transaction.deleted) return true
  if (transaction.income < 0.0001 && transaction.outcome < 0.0001) return true
  return false
}

export function isTransactionViewed(transaction: TTransaction): boolean {
  if (transaction.deleted) return true
  if (transaction.viewed === true) return true
  if (transaction.viewed === undefined) return true
  return false
}

export function getTransactionType(
  transaction: TTransaction,
  debtAccountId?: TAccountId
): TrType {
  if (debtAccountId && transaction.incomeAccount === debtAccountId) {
    return TrType.OutcomeDebt
  }
  if (debtAccountId && transaction.outcomeAccount === debtAccountId) {
    return TrType.IncomeDebt
  }
  if (transaction.income && transaction.outcome) return TrType.Transfer
  if (transaction.outcome) return TrType.Outcome
  return TrType.Income
}
