import type { TAccountId, TTransaction } from '6-shared/types'

export enum TrType {
  Income = 'income',
  Outcome = 'outcome',
  Transfer = 'transfer',
  IncomeDebt = 'incomeDebt',
  OutcomeDebt = 'outcomeDebt',
}

export function compareTransactionDates(
  transactionA: TTransaction,
  transactionB: TTransaction
) {
  if (transactionA.date < transactionB.date) return 1
  if (transactionA.date > transactionB.date) return -1
  return transactionB.created - transactionA.created
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
