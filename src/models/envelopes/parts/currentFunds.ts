import { createSelector } from '@reduxjs/toolkit'
import { getInBudgetAccounts } from 'models/account'
import { add } from 'shared/helpers/currencyHelpers'
import { TInstAmount } from '../helpers/fxAmount'

export const getCurrentFunds = createSelector([getInBudgetAccounts], accounts =>
  accounts.reduce((total, account) => {
    total[account.instrument] ??= 0
    total[account.instrument] = add(total[account.instrument], account.balance)
    return total
  }, {} as TInstAmount)
)
