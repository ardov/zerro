import startOfMonth from 'date-fns/startOfMonth'
import startOfDay from 'date-fns/startOfDay'
import startOfWeek from 'date-fns/startOfWeek'
import { convertAmount } from 'helpers/currencyHelpers'
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

/**
 * Accumulates data about transaction array
 * @param {Array of Transaction} group type
 * @return {Object} results partitioned by income and outcome
 */
export function calcMetrics(arr, instrumentRate = 1) {
  const startObject = {
    total: {
      income: 0,
      outcome: 0,
      transactions: [],
    },
    byTag: {},
  }

  const reducer = (acc, tr) => {
    const type = tr.type
    if (type !== 'transfer' && !tr.deleted) {
      const amount = +(
        (tr[type] * tr[type + 'Instrument'].rate) /
        instrumentRate
      ).toFixed(2)
      const mainTagId = tr.tag ? tr.tag[0].id : null

      // Add to total
      acc.total[type] += amount
      acc.total.transactions.push(tr)

      // Add to tag
      if (!acc.byTag[mainTagId]) {
        acc.byTag[mainTagId] = { income: 0, outcome: 0, transactions: [] }
      }
      acc.byTag[mainTagId][type] += amount
      acc.byTag[mainTagId].transactions.push(tr)
    }
    return acc
  }

  return arr.reduce(reducer, startObject)
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

export function calcMetricsByTag(
  transactions,
  targetInstrumentId,
  instruments
) {
  const convert = (amount, instrumentId) =>
    convertAmount(amount, instrumentId, targetInstrumentId, instruments, 2)

  return transactions.reduce((acc, tr) => {
    const type = getType(tr)
    if (type !== 'transfer') {
      const amount = convert(tr[type], tr[type + 'Instrument'])
      const mainTagId = tr.tag ? tr.tag[0] : null
      if (!acc[mainTagId]) acc[mainTagId] = { income: 0, outcome: 0 }
      acc[mainTagId][type] += amount
    }
    return acc
  }, {})
}
