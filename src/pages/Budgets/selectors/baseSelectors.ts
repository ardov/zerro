import { createSelector } from '@reduxjs/toolkit'
import { getInBudgetAccounts, getStartBalance } from 'models/data/accounts'
import { convertCurrency } from 'models/data/instruments'
import { round } from 'shared/helpers/currencyHelpers'
import { TSelector } from 'shared/types'

export const getStartFunds: TSelector<number> = createSelector(
  [getInBudgetAccounts, convertCurrency],
  (accounts, convert) => {
    return accounts
      .map(acc => convert(getStartBalance(acc), acc.instrument))
      .reduce((sum, balance) => round(sum + balance), 0)
  }
)