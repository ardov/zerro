import { createSelector } from '@reduxjs/toolkit'
import { getInBudgetAccounts } from 'store/localData/accounts'
import { convertCurrency } from 'store/data/selectors'
import { getSortedTransactions } from 'store/localData/transactions'
import { getStartBalance } from 'store/localData/accounts/helpers'
import { withPerf } from 'helpers/performance'

export const getStartFunds = createSelector(
  [getInBudgetAccounts, convertCurrency],
  withPerf('BUDGET: getStartFunds', (accounts, convert) => {
    let sum = 0
    for (const acc of accounts) {
      const startBalance = convert(getStartBalance(acc), acc.instrument) || 0
      sum = sum + startBalance
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
