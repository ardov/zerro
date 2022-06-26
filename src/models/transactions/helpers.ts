import startOfWeek from 'date-fns/startOfWeek'
import { checkRaw, FilterConditions } from './filtering'
import { TRawTransaction, TTransactionId, TrType, TISODate } from 'shared/types'
import { toISODate, toISOMonth } from 'shared/helpers/date'

/**
 * Groups array of transactions
 */
export function groupTransactionsBy(
  groupType: 'DAY' | 'WEEK' | 'MONTH' = 'DAY',
  transactions: TRawTransaction[] = [],
  filterConditions?: FilterConditions
) {
  const groupTypes = {
    DAY: (date: TRawTransaction['date']) => date,
    WEEK: (date: TRawTransaction['date']) =>
      toISODate(startOfWeek(new Date(date), { weekStartsOn: 1 })),
    MONTH: (date: TRawTransaction['date']) => toISODate(toISOMonth(date)),
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

export function compareDates(tr1: TRawTransaction, tr2: TRawTransaction) {
  if (tr1.date < tr2.date) return 1
  if (tr1.date > tr2.date) return -1
  return tr2.created - tr1.created
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
