import { createSelector } from '@reduxjs/toolkit'
import { getInBudgetAccounts } from 'store/localData/accounts'
import { convertCurrency } from 'store/serverData'
import { round } from 'helpers/currencyHelpers'
import { getSortedTransactions } from 'store/localData/transactions'
import { getStartBalance } from 'store/localData/accounts/helpers'

export const getStartFunds = createSelector(
  [getInBudgetAccounts, convertCurrency],
  (accounts, convert) => {
    let sum = 0
    for (const acc of accounts) {
      const startBalance = convert(getStartBalance(acc), acc.instrument) || 0
      sum = round(sum + startBalance)
    }
    return sum
  }
)

export const getTransactionsInBudget = createSelector(
  [getSortedTransactions, getInBudgetAccounts],
  (transactions, accounts) => {
    const accIds = accounts.map(acc => acc.id)
    return transactions.filter(
      tr =>
        !tr.deleted &&
        (accIds.includes(tr.incomeAccount) ||
          accIds.includes(tr.outcomeAccount))
    )
  }
)
