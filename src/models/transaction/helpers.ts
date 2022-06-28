import { checkRaw, FilterConditions } from './filtering'
import { TISODate } from 'shared/types'
import {
  parseDate,
  startOfMonth,
  startOfWeek,
  toISODate,
} from 'shared/helpers/date'
import { TrType, TTransaction, TTransactionId } from './types'

/**
 * Groups array of transactions
 */
export function groupTransactionsBy(
  groupType: 'DAY' | 'WEEK' | 'MONTH' = 'DAY',
  transactions: TTransaction[] = [],
  filterConditions?: FilterConditions
) {
  const groupTypes = {
    DAY: (date: TTransaction['date']) => date,
    WEEK: (date: TTransaction['date']) => toISODate(startOfWeek(date)),
    MONTH: (date: TTransaction['date']) => toISODate(startOfMonth(date)),
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

export function compareDates(tr1: TTransaction, tr2: TTransaction) {
  if (tr1.date < tr2.date) return 1
  if (tr1.date > tr2.date) return -1
  return tr2.created - tr1.created
}

export const isDeleted = (tr: TTransaction) => {
  if (tr.deleted) return true
  if (tr.income < 0.0001 && tr.outcome < 0.0001) return true
  return false
}

export function getType(tr: TTransaction, debtId?: string): TrType {
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
