import { createSelector } from '@reduxjs/toolkit'
import { getInBudgetAccounts, getStartBalance } from 'store/data/accounts'
import { convertCurrency } from 'store/data/instruments'
import { round } from 'helpers/currencyHelpers'
import { getSortedTransactions } from 'store/data/transactions'
import { withPerf } from 'helpers/performance'

export const getStartFunds = createSelector(
  [getInBudgetAccounts, convertCurrency],
  withPerf('BUDGET: getStartFunds', (accounts, convert) => {
    let sum = 0
    for (const acc of accounts) {
      const startBalance = convert(getStartBalance(acc), acc.instrument) || 0
      sum = round(sum + startBalance)
    }
    return sum
  })
)

export const getTransactionsInBudget = createSelector(
  [getSortedTransactions, getInBudgetAccounts],
  withPerf('BUDGET: getTransactionsInBudget', (transactions, accounts) => {
    const accIds = accounts.map(acc => acc.id)
    return transactions.filter(
      tr =>
        !tr.deleted &&
        (accIds.includes(tr.incomeAccount) ||
          accIds.includes(tr.outcomeAccount))
    )
  })
)
