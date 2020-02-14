import createSelector from 'selectorator'
import { getAccountsInBudget } from 'store/localData/accounts'
import { convertCurrency } from 'store/serverData'
import { round } from 'helpers/currencyHelpers'
import { getSortedTransactions } from 'store/localData/transactions'

export const getStartFunds = createSelector(
  [getAccountsInBudget, convertCurrency],
  (accounts, convert) =>
    accounts
      //  Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
      .filter(acc => acc.type !== 'deposit' && acc.type !== 'loan')
      .reduce(
        (sum, acc) => round(sum + convert(acc.startBalance, acc.instrument)),
        0
      )
)

export const getTransactionsInBudget = createSelector(
  [getSortedTransactions, getAccountsInBudget],
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
