import { TAccountId, TTransaction } from '6-shared/types'
import { parseDate } from '6-shared/helpers/date'

export function compareTrDates(tr1: TTransaction, tr2: TTransaction) {
  if (tr1.date < tr2.date) return 1
  if (tr1.date > tr2.date) return -1
  return tr2.created - tr1.created
}

export const isDeleted = (tr: TTransaction) => {
  if (tr.deleted) return true
  if (tr.income < 0.0001 && tr.outcome < 0.0001) return true
  return false
}

export enum TrType {
  Income = 'income',
  Outcome = 'outcome',
  Transfer = 'transfer',
  IncomeDebt = 'incomeDebt',
  OutcomeDebt = 'outcomeDebt',
}

export function getType(tr: TTransaction, debtId?: TAccountId): TrType {
  if (debtId && tr.incomeAccount === debtId) return TrType.OutcomeDebt
  if (debtId && tr.outcomeAccount === debtId) return TrType.IncomeDebt
  if (tr.income && tr.outcome) return TrType.Transfer
  if (tr.outcome) return TrType.Outcome
  return TrType.Income
}

export function getTime(tr: TTransaction) {
  const date = parseDate(tr.date)
  const creationDate = parseDate(tr.created)
  creationDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  return creationDate
}

export function getMainTag(tr: TTransaction) {
  if (tr.tag) return tr.tag[0]
  else return null
}

export function isViewed(tr: TTransaction) {
  if (tr.deleted) return true
  if (tr.viewed === true) return true
  if (tr.viewed === undefined) return true
  return false
}
