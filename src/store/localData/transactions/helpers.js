import startOfMonth from 'date-fns/startOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfWeek from 'date-fns/startOfWeek'
import { checkRaw } from 'store/filterConditions'

/**
 * Groups array of transactions
 * @param {String: groupType} DAY | WEEK | MONTH
 * @param {Array: arr} Array of Transaction
 * @return {Array} of objects {date, transactions}
 */
export function groupTransactionsBy(
  groupType = 'DAY',
  arr = [],
  filterConditions = {}
) {
  const groupTypes = {
    DAY: date => startOfDay(date),
    WEEK: date => startOfWeek(date, { weekStartsOn: 1 }),
    MONTH: date => startOfMonth(date),
  }
  const converter = groupTypes[groupType]
  const checker = checkRaw(filterConditions)
  let groups = {}

  for (const tr of arr) {
    if (checker(tr)) {
      const date = +converter(tr.date)
      if (groups[date]) groups[date].transactions.push(tr.id)
      else groups[date] = { date, transactions: [tr.id] }
    }
  }

  return Object.values(groups)
}

export function sortBy(sortType = 'DATE', ascending = false) {
  const sortFuncs = {
    DATE: (tr1, tr2) => {
      const result =
        +tr2.date === +tr1.date
          ? tr2.created - tr1.created
          : tr2.date - tr1.date
      return ascending ? -result : result
    },
    CHANGED: (tr1, tr2) =>
      ascending ? tr1.changed - tr2.changed : tr2.changed - tr1.changed,
  }
  return sortFuncs[sortType]
}

export function mapTags(ids, tags) {
  return ids && ids.length ? ids.map(id => tags[id]) : null
}

export function getType(tr) {
  return tr.income && tr.outcome ? 'transfer' : tr.income ? 'income' : 'outcome'
}

export function getTime(tr) {
  const creationDate = new Date(tr.created)
  const hours = creationDate.getHours()
  const minutes = creationDate.getMinutes()
  const seconds = creationDate.getSeconds()
  const trTime = new Date(tr.date)
  trTime.setHours(hours, minutes, seconds)
  return +trTime
}

export function getMainTag(tr) {
  return tr.tag && tr.tag.length ? tr.tag[0] : null
}
