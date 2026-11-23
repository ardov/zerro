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

/** Sort once for both the full ID list and the visible transaction history. */
export function getSortedTransactions(
  transactions: ById<TTransaction>
): TTransaction[] {
  return Object.values(transactions).sort(compareTransactionDates).reverse()
}

export function toTransactionHistory(sorted: TTransaction[]): TTransaction[] {
  return sorted.filter(transaction => !isDeletedTransaction(transaction))
}

/** All IDs in list order, including soft-deleted entries; UI filters decide visibility. */
export function toTransactionIds(sorted: TTransaction[]): TTransactionId[] {
  return sorted.map(transaction => transaction.id)
}

export function compareTransactionDates(
  transactionA: TTransaction,
  transactionB: TTransaction
) {
  if (transactionA.date < transactionB.date) return 1
  if (transactionA.date > transactionB.date) return -1
  return transactionB.created - transactionA.created
}

/** Visibility heuristic for older and unsynced rows below Zenmoney's 4-decimal precision. The materializer predicts actual purges. */
const deletableAmount = 0.0001

function hasDeletableAmounts(
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

/** Money on real accounts; a debt account's technical leg is excluded. */
export function getTransactionMoney(
  transaction: TTransaction,
  debtAccountId?: TAccountId
) {
  const income = {
    amount: transaction.income,
    instrument: transaction.incomeInstrument,
  }
  const outcome = {
    amount: transaction.outcome,
    instrument: transaction.outcomeInstrument,
  }
  const type = getTransactionType(transaction, debtAccountId)
  if (type === TrType.Income || type === TrType.IncomeDebt) return [income]
  if (type === TrType.Outcome || type === TrType.OutcomeDebt) return [outcome]
  return [income, outcome]
}
