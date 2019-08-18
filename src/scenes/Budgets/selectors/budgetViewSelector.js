import createSelector from 'selectorator'
import { getBudgetsByMonthAndTag } from 'store/data/budgets'
import { getTagsTree } from 'store/data/tags'
import { getUserInstrument } from 'store/data/users'
import { getInstruments } from 'store/data/instruments'
import Month from './Month'
import getMonthDates from './getMonthDates'
import {
  getTransactionsInBudget,
  getAccountsInBudget,
  getStartFunds,
} from './baseSelectors'
import { getAccounts } from 'store/data/accounts'

export default createSelector(
  [
    getTransactionsInBudget,
    getBudgetsByMonthAndTag,
    getTagsTree,
    getAccountsInBudget,
    getAccounts,
    getUserInstrument,
    getInstruments,
    getMonthDates,
    getStartFunds,
  ],
  (
    transactions,
    budgets,
    tags,
    accountsInBudget,
    accounts,
    userInstrument,
    instruments,
    monthDates,
    startFunds
  ) => {
    if (!userInstrument) return null

    let prevMonth = null // need this to save previous month to pass it
    const months = monthDates.map((date, i) => {
      const month = new Month(date, {
        prevMonth,
        startFunds: i === 0 ? startFunds : null,
        transactions,
        tags,
        budgets: budgets[+date] ? budgets[+date] : {},
        accountsInBudget,
        accounts,
        userInstrument,
        instruments,
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
