import { checkRaw, FilterConditions } from './filtering'
import { TISODate, ITransaction, TTransactionId } from '@shared/types'
import {
  parseDate,
  startOfMonth,
  startOfWeek,
  toISODate,
} from '@shared/helpers/date'

/**
 * Groups array of transactions
 */
export function groupTransactionsBy(
  groupType: 'DAY' | 'WEEK' | 'MONTH' = 'DAY',
  transactions: ITransaction[] = [],
  filterConditions?: FilterConditions
) {
  const groupTypes = {
    DAY: (date: ITransaction['date']) => date,
    WEEK: (date: ITransaction['date']) => toISODate(startOfWeek(date)),
    MONTH: (date: ITransaction['date']) => toISODate(startOfMonth(date)),
  }
  const converter = groupTypes[groupType]
  const checker = checkRaw(filterConditions)
  let groups: {
    [k: string]: { date: TISODate; transactions: TTransactionId[] }
  } = {}

  transactions.forEach(tr => {
    if (checker(tr)) {
      const date = converter(tr.date)
      groups[date] ??= { date, transactions: [] }
      groups[date].transactions.push(tr.id)
    }
  })

  return Object.values(groups)
}

export function compareTrDates(tr1: ITransaction, tr2: ITransaction) {
  if (tr1.date < tr2.date) return 1
  if (tr1.date > tr2.date) return -1
  return tr2.created - tr1.created
}

export const isDeleted = (tr: ITransaction) => {
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

export function getType(tr: ITransaction, debtId?: string): TrType {
  if (debtId && tr.incomeAccount === debtId) return TrType.OutcomeDebt
  if (debtId && tr.outcomeAccount === debtId) return TrType.IncomeDebt
  if (tr.income && tr.outcome) return TrType.Transfer
  if (tr.outcome) return TrType.Outcome
  return TrType.Income
}

export function getTime(tr: ITransaction) {
  const date = parseDate(tr.date)
  const creationDate = parseDate(tr.created)
  creationDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  return creationDate
}

export function getMainTag(tr: ITransaction) {
  if (tr.tag) return tr.tag[0]
  else return null
}

export function isNew(tr: ITransaction) {
  if (tr.deleted) return false
  if (tr.viewed) return false
  const DAY = 1000 * 60 * 60 * 24
  if (Date.now() - tr.changed > 31 * DAY) return false
  return true
}
