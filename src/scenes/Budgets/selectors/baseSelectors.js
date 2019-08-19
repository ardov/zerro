import createSelector from 'selectorator'
import { getAccounts } from 'store/data/accounts'
import { getUserInstrument } from 'store/data/instruments'
import { getInstruments } from 'store/data/instruments'
import { round } from 'helpers/currencyHelpers'
import { getTransactions } from 'store/data/transactions'
import { checkRaw } from 'store/filterConditions'

export const getAccountsInBudget = createSelector(
  [getAccounts],
  accounts =>
    Object.values(accounts).filter(
      a => !a.archive && !a.savings && a.type !== 'debt'
    )
)

export const getStartFunds = createSelector(
  [getAccountsInBudget, getUserInstrument, getInstruments],
  (accounts, userInstrument, instruments) =>
    accounts.reduce(
      (sum, acc) =>
        round(
          sum +
            (acc.startBalance * instruments[acc.instrument].rate) /
              userInstrument.rate
        ),
      0
    )
)

export const getTransactionsInBudget = createSelector(
  [getTransactions, getAccountsInBudget],
  (transactions, accounts) => {
    const accIds = accounts.map(acc => acc.id)
    return Object.values(transactions).filter(
      checkRaw({
        deleted: false,
        accounts: accIds,
      })
    )
  }
)
