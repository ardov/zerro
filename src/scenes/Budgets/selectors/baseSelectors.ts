import createSelector from 'selectorator'
import { getAccountsInBudget } from 'store/localData/accounts'
import { convertCurrency } from 'store/serverData'
import { round } from 'helpers/currencyHelpers'
import { getSortedTransactions } from 'store/localData/transactions'
import { getStartBalance } from 'store/localData/accounts/helpers'
import { Transaction, Account } from 'types'

export const getStartFunds: (state: any) => number = createSelector(
  [getAccountsInBudget, convertCurrency],
  (accounts: Account[], convert) => {
    let sum = 0
    for (const acc of accounts) {
      const startBalance = convert(getStartBalance(acc), acc.instrument)
      sum = round(sum + startBalance)
    }
    return sum
  }
)

export const getTransactionsInBudget: (
  state: any
) => Transaction[] = createSelector(
  [getSortedTransactions, getAccountsInBudget],
  (transactions: Transaction[], accounts: Account[]) => {
    const accIds = accounts.map(acc => acc.id)
    return transactions.filter(
      tr =>
        !tr.deleted &&
        (accIds.includes(tr.incomeAccount) ||
          accIds.includes(tr.outcomeAccount))
    )
  }
)
