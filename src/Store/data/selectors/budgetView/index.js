import createSelector from 'selectorator'
import { getTransactionList } from '../transaction'
import { getBudgetsByMonthAndTag } from '../budgets'
import { getTagsTree } from '../tags'
import { getInBalance } from '../accounts'
import { check } from '../../../filterConditions'
import startOfMonth from 'date-fns/start_of_month'
import isSameMonth from 'date-fns/is_same_month'
import { getRootUser } from '../users'
import Month from './Month'

export const getAllBudgets = createSelector(
  [
    getTransactionList,
    getBudgetsByMonthAndTag,
    getTagsTree,
    getInBalance,
    getRootUser
  ],
  (transactions, budgets, tags, accountsInBalance, rootUser) => {
    const userInstrument = rootUser.currency
    const filteredTr = transactions.filter(
      check({
        deleted: false,
        accounts: accountsInBalance.map(acc => acc.id)
      })
    )

    const firstMonth = startOfMonth(filteredTr[filteredTr.length - 1].date)
    const lastMonth = getLastMonth(budgets)
    const monthDates = generateMonthDates(firstMonth, lastMonth)
    const months = monthDates.map(
      date =>
        new Month(date, {
          transactions: filteredTr,
          tags,
          budgets,
          accountsInBalance,
          userInstrument,
          prevFunds: 1200,
          prevOverspent: 0,
          budgetedInFuture: 0
        })
    )

    return { months }
  }
)

// HELPERS

function getLastMonth(budgets) {
  const lastBudget = new Date(
    Object.keys(budgets)
      .map(s => parseInt(s))
      .sort((a, b) => b - a)
      .pop()
  )
  const thisMonth = startOfMonth(Date.now())
  return lastBudget > thisMonth ? lastBudget : thisMonth
}

function generateMonthDates(first, last) {
  if (isSameMonth(first, last)) return [first]
  const result = []
  let current = first
  while (!isSameMonth(current, last)) {
    result.push(current)
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
  }
  return result
}
