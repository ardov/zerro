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

export function getTransaction(
  transactions: ById<TTransaction>,
  id: TTransactionId
): TTransaction | null {
  return transactions[id] || null
}

/**
 * Every transaction in canonical list order, including soft-deleted entries.
 * The id list and the non-deleted history are both slices of this one sort, so
 * a runtime can memoize it once and derive both without re-sorting.
 */
export function getSortedTransactions(
  transactions: ById<TTransaction>
): TTransaction[] {
  return Object.values(transactions).sort(compareTransactionDates).reverse()
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

export function getTransactionIds(
  transactions: ById<TTransaction>
): TTransactionId[] {
  return toTransactionIds(getSortedTransactions(transactions))
}

export function getTransactionsHistory(
  transactions: ById<TTransaction>
): TTransaction[] {
  return toTransactionHistory(getSortedTransactions(transactions))
}

export function compareTransactionDates(
  transactionA: TTransaction,
  transactionB: TTransaction
) {
  if (transactionA.date < transactionB.date) return 1
  if (transactionA.date > transactionB.date) return -1
  return transactionB.created - transactionA.created
}

/**
 * Historical read-model threshold used to hide effectively empty rows.
 *
 * This is a presentation heuristic, not a general statement about server purge
 * semantics. The exact write shape verified to produce a tombstone is kept
 * separately in the materializer.
 */
const deletableAmount = 0.0001

/** Both amounts are small enough for Zerro to treat the row as hidden. */
export function hasDeletableAmounts(
  transaction: Pick<TTransaction, 'income' | 'outcome'>
): boolean {
  return (
    transaction.income < deletableAmount &&
    transaction.outcome < deletableAmount
  )
}

export function isDeletedTransaction(transaction: TTransaction): boolean {
  if (transaction.deleted) return true
  return hasDeletableAmounts(transaction)
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
