import type { ById, TDataStore } from '6-shared/types'
import type { TAccountId } from '../accounts'
import type { TTransaction, TTransactionId } from './types'

export enum TrType {
  Income = 'income',
  Outcome = 'outcome',
  Transfer = 'transfer',
  IncomeDebt = 'incomeDebt',
  OutcomeDebt = 'outcomeDebt',
}

export function getTransactions(data: TDataStore): ById<TTransaction> {
  return data.transaction
}

export function getTransaction(
  data: TDataStore,
  id: TTransactionId
): TTransaction | null {
  return getTransactions(data)[id] || null
}

export function getTransactionsHistory(data: TDataStore): TTransaction[] {
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
