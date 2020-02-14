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
  if (!arr) return []
  const groupTypes = {
    DAY: tr => startOfDay(tr.date),
    WEEK: tr => startOfWeek(tr.date, { weekStartsOn: 1 }),
    MONTH: tr => startOfMonth(tr.date),
    CHANGED: tr => tr.changed,
  }
  const converter = groupTypes[groupType]
  const checker = checkRaw(filterConditions)
  let groups = {}

  arr.forEach(tr => {
    if (checker(tr)) {
      const date = +converter(tr)
      if (groups[date]) groups[date].transactions.push(tr.id)
      else groups[date] = { date, transactions: [tr.id] }
    }
  })

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

export function getMainTag(tr) {
  return tr.tag && tr.tag.length ? tr.tag[0] : null
}
