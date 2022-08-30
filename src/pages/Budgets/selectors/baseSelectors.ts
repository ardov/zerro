import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from '@store'
import { getInBudgetAccounts, getStartBalance } from '@entities/account'
import { convertCurrency } from '@entities/instrument'
import { round } from '@shared/helpers/money'

export const getStartFunds: TSelector<number> = createSelector(
  [getInBudgetAccounts, convertCurrency],
  (accounts, convert) => {
    return accounts
      .map(acc => convert(getStartBalance(acc), acc.instrument))
      .reduce((sum, balance) => round(sum + balance), 0)
  }
)
