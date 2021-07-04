import startOfMonth from 'date-fns/startOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfWeek from 'date-fns/startOfWeek'
import { checkRaw, FilterConditions } from './filtering'
import { Transaction, TransactionId, TransactionType } from 'types'

/**
 * Groups array of transactions
 */
export function groupTransactionsBy(
  groupType: 'DAY' | 'WEEK' | 'MONTH' = 'DAY',
  arr: Transaction[] = [],
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
    [k: string]: { date: number; transactions: TransactionId[] }
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

export function compareDates(tr1: Transaction, tr2: Transaction) {
  return tr2.date === tr1.date ? tr2.created - tr1.created : tr2.date - tr1.date
}

export function getType(tr: Transaction, debtId?: string): TransactionType {
  if (debtId && tr.incomeAccount === debtId) return 'outcomeDebt'
  if (debtId && tr.outcomeAccount === debtId) return 'incomeDebt'
  if (tr.income && tr.outcome) return 'transfer'
  if (tr.outcome) return 'outcome'
  return 'income'
}

export function getTime(tr: Transaction) {
  const date = new Date(tr.date)
  const creationDate = new Date(tr.created)
  creationDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
  return +creationDate
}

export function getMainTag(tr: Transaction) {
  if (tr.tag) return tr.tag[0]
  else return null
}

export function isNew(tr: Transaction) {
  if (tr.deleted) return false
  if (tr.viewed) return false
  const DAY = 1000 * 60 * 60 * 24
  if (Date.now() - +new Date(tr.changed) > 31 * DAY) return false
  return true
}
