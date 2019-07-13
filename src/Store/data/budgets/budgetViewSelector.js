import createSelector from 'selectorator'
import { getTransactionList } from 'store/data/transactions'
import { getBudgetsByMonthAndTag } from 'store/data/budgets/selectors'
import { getTagsTree } from 'store/data/tags'
import { getInBalance } from 'store/data/accounts'
import { check } from 'store/filterConditions'
import startOfMonth from 'date-fns/start_of_month'
import isSameMonth from 'date-fns/is_same_month'
import { getUserInstrument } from 'store/data/users'
import Month from './Month'

export default createSelector(
  [
    getTransactionList,
    getBudgetsByMonthAndTag,
    getTagsTree,
    getInBalance,
    getUserInstrument,
  ],
  (transactions, budgets, tags, accountsInBalance, userInstrument) => {
    if (!userInstrument) return null

    const filteredTr = transactions.filter(
      check({
        deleted: false,
        accounts: accountsInBalance.map(acc => acc.id),
      })
    )

    const startFunds = accountsInBalance.reduce((sum, acc) => {
      return (sum +=
        (acc.startBalance * acc.instrument.rate) / userInstrument.rate)
    }, 0)

    const firstMonth = startOfMonth(filteredTr[filteredTr.length - 1].date)
    const lastMonth = getLastMonth(budgets)
    const monthDates = generateMonthDates(firstMonth, lastMonth)

    let prevMonth = null // need this to save previous month to pass it
    const months = monthDates.map((date, i) => {
      const month = new Month(date, {
        prevMonth,
        startFunds: i === 0 ? startFunds : null,
        transactions: filteredTr,
        tags,
        budgets: budgets[+date] ? budgets[+date] : {},
        accountsInBalance,
        userInstrument,
        budgetedInFuture: 0,
      })
      prevMonth = month
      return month
    })

    // Add future budget sum to months
    months.reduceRight((realBudgetedInFuture, month) => {
      month.realBudgetedInFuture = realBudgetedInFuture
      return realBudgetedInFuture + month.budgeted
    }, 0)

    return months
  }
)

// HELPERS

function getLastMonth(budgets) {
  const lastBudget = new Date(
    Object.keys(budgets)
      .map(s => parseInt(s))
      .sort((a, b) => a - b)
      .pop()
  )
  const nextMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1
  )
  return lastBudget > nextMonth ? lastBudget : nextMonth
}

function generateMonthDates(first, last) {
  const result = []
  let current = new Date(first.getFullYear(), first.getMonth() - 1, 1)
  do {
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    result.push(current)
  } while (!isSameMonth(current, last))
  return result
}
