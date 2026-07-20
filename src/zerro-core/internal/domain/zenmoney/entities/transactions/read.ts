import type { ById } from '../../../foundation/types'
import type { TAccountId } from '../accounts'
import type { TTransaction, TTransactionId } from './types'

export enum TrType {
  Income = 'income',
  Outcome = 'outcome',
  Transfer = 'transfer',
  IncomeDebt = 'incomeDebt',
  OutcomeDebt = 'outcomeDebt',
}

export type TTransactionSource = { transaction: ById<TTransaction> }

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
 * Every transaction in canonical list order, including soft-deleted entries.
 * The id list and the non-deleted history are both slices of this one sort, so
 * a runtime can memoize it once and derive both without re-sorting.
 */
export function getSortedTransactions(
  data: TTransactionSource
): TTransaction[] {
  return Object.values(getTransactions(data))
    .sort(compareTransactionDates)
    .reverse()
}

/** Non-deleted transactions in list order. */
export function toTransactionHistory(sorted: TTransaction[]): TTransaction[] {
  return sorted.filter(transaction => !isDeletedTransaction(transaction))
}

/**
 * Every transaction id in list order, including soft-deleted entries.
 * UI filtering decides whether deleted rows are visible.
 */
export function toTransactionIds(sorted: TTransaction[]): TTransactionId[] {
  return sorted.map(transaction => transaction.id)
}

export function getTransactionIds(data: TTransactionSource): TTransactionId[] {
  return toTransactionIds(getSortedTransactions(data))
}

export function getTransactionsHistory(
  data: TTransactionSource
): TTransaction[] {
  return toTransactionHistory(getSortedTransactions(data))
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
