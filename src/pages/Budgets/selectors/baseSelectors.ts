import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from 'models'
import { getInBudgetAccounts, getStartBalance } from 'models/account'
import { convertCurrency } from 'models/instrument'
import { round } from 'shared/helpers/currencyHelpers'

export const getStartFunds: TSelector<number> = createSelector(
  [getInBudgetAccounts, convertCurrency],
  (accounts, convert) => {
    return accounts
      .map(acc => convert(getStartBalance(acc), acc.instrument))
      .reduce((sum, balance) => round(sum + balance), 0)
  }
)
