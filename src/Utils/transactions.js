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
    day: date => startOfDay(date),
    week: date => startOfWeek(date, { weekStartsOn: 1 }),
    month: date => startOfMonth(date)
  }

  const reducer = (groupped, tr) => {
    let lastDate = groupped.length ? groupped[groupped.length - 1].date : null
    if (+lastDate === +groupTypes[groupType](tr.date)) {
      groupped[groupped.length - 1].transactions.push(tr)
    } else {
      groupped.push({
        date: groupTypes[groupType](tr.date),
        transactions: [tr]
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
export function calcMetrics(arr) {
  const startObject = {
    income: {
      total: { sum: 0, transactions: [] },
      byTags: {}
    },
    outcome: {
      total: { sum: 0, transactions: [] },
      byTags: {}
    }
  }

  const reducer = (acc, tr) => {
    const type = tr.type
    if (type !== 'transfer' && !tr.deleted) {
      const amount = +(tr[type] * tr[type + 'Instrument'].rate).toFixed(2)
      const mainTagId = tr.tag.length ? tr.tag[0].id : 'noTag'

      // Add to total
      acc[type].total.sum += amount
      acc[type].total.transactions.push(tr.id)

      // Add to tag
      if (acc[type].byTags[mainTagId]) {
        acc[type].byTags[mainTagId].sum += amount
        acc[type].byTags[mainTagId].transactions.push(tr.id)
      } else {
        acc[type].byTags[mainTagId] = { sum: amount, transactions: [tr.id] }
      }
    }
    return acc
  }

  return arr.reduce(reducer, startObject)
}
