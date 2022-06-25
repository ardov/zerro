import startOfMonth from 'date-fns/startOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfWeek from 'date-fns/startOfWeek'
import { checkRaw, FilterConditions } from './filtering'
import { TRawTransaction, TTransactionId, TrType } from 'shared/types'

/**
 * Groups array of transactions
 */
export function groupTransactionsBy(
  groupType: 'DAY' | 'WEEK' | 'MONTH' = 'DAY',
  arr: TRawTransaction[] = [],
  filterConditions?: FilterConditions
) {
  const groupTypes = {
    DAY: (date: number | Date) => startOfDay(date),
    WEEK: (date: number | Date) => startOfWeek(date, { weekStartsOn: 1 }),
    MONTH: (date: number | Date) => startOfMonth(date),
  }
  const converter = groupTypes[groupType]
  const checker = checkRaw(filterConditions)
  let groups: {
    [k: string]: { date: number; transactions: TTransactionId[] }
  } = {}

  for (const tr of arr) {
    if (checker(tr)) {
      const date = +converter(tr.date)
      if (groups[date]) groups[date].transactions.push(tr.id)
      else groups[date] = { date, transactions: [tr.id] }
    }
  }

  return Object.values(groups)
}

export function compareDates(tr1: TRawTransaction, tr2: TRawTransaction) {
  return tr2.date === tr1.date ? tr2.created - tr1.created : tr2.date - tr1.date
}

export const isDeleted = (tr: TRawTransaction) => {
  if (tr.deleted) return true
  if (tr.income < 0.0001 && tr.outcome < 0.0001) return true
  return false
}

export function getType(tr: TRawTransaction, debtId?: string): TrType {
  if (debtId && tr.incomeAccount === debtId) return TrType.outcomeDebt
  if (debtId && tr.outcomeAccount === debtId) return TrType.incomeDebt
  if (tr.income && tr.outcome) return TrType.transfer
  if (tr.outcome) return TrType.outcome
  return TrType.income
}

export function getTime(tr: TRawTransaction) {
  const date = new Date(tr.date)
  const creationDate = new Date(tr.created)
  creationDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  return +creationDate
}

export function getMainTag(tr: TRawTransaction) {
  if (tr.tag) return tr.tag[0]
  else return null
}

export function isNew(tr: TRawTransaction) {
  if (tr.deleted) return false
  if (tr.viewed) return false
  const DAY = 1000 * 60 * 60 * 24
  if (Date.now() - +new Date(tr.changed) > 31 * DAY) return false
  return true
}
