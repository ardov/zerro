// HELPERS
import startOfMonth from 'date-fns/start_of_month'
import startOfDay from 'date-fns/start_of_day'
import startOfWeek from 'date-fns/start_of_week'

/**
 * Groups array of transactions
 * @param {String: groupType} day | week | month
 * @param {Array: arr} Array of Transaction
 * @return {Array} of objects {date, transactions}
 */
export function groupTransactionsBy(groupType = 'day', arr) {
  if (!arr) return []
  const groupTypes = {
    day: tr => startOfDay(tr.date),
    week: tr => startOfWeek(tr.date, { weekStartsOn: 1 }),
    month: tr => startOfMonth(tr.date),
  }

  const reducer = (groupped, tr) => {
    let lastDate = groupped.length ? groupped[groupped.length - 1].date : null
    if (+lastDate === +groupTypes[groupType](tr)) {
      groupped[groupped.length - 1].transactions.push(tr)
    } else {
      groupped.push({
        date: groupTypes[groupType](tr),
        transactions: [tr],
      })
    }
    return groupped
  }

  return arr.reduce(reducer, [])
}

/**
 * Groups array of transactions returns IDs
 * @param {String: groupType} day | week | month
 * @param {Array: arr} Array of Transaction
 * @return {Array} of objects {date, transactions}
 */
export function groupTransactionsAndReturnId(groupType = 'day', arr) {
  if (!arr) return []
  const groupTypes = {
    day: date => startOfDay(date),
    week: date => startOfWeek(date, { weekStartsOn: 1 }),
    month: date => startOfMonth(date),
  }

  const reducer = (groupped, tr) => {
    let lastDate = groupped.length ? groupped[groupped.length - 1].date : null
    if (+lastDate === +groupTypes[groupType](tr.date)) {
      groupped[groupped.length - 1].transactions.push(tr.id)
    } else {
      groupped.push({
        date: groupTypes[groupType](tr.date),
        transactions: [tr.id],
      })
    }
    return groupped
  }

  return arr.reduce(reducer, [])
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
