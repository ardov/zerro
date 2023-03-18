import { TAccountId, TTransaction } from '@shared/types'
import { parseDate } from '@shared/helpers/date'

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

export function isNew(tr: TTransaction) {
  if (tr.deleted) return false
  if (tr.viewed) return false
  const DAY = 1000 * 60 * 60 * 24
  if (Date.now() - tr.changed > 31 * DAY) return false
  return true
}
