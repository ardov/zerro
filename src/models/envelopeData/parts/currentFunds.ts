import { createSelector } from '@reduxjs/toolkit'
import { getInBudgetAccounts } from 'models/account'
import { add } from 'shared/helpers/money'
import { TFxAmount } from 'shared/types'

export const getCurrentFunds = createSelector([getInBudgetAccounts], accounts =>
  accounts.reduce((total, account) => {
    total[account.fxCode] ??= 0
    total[account.fxCode] = add(total[account.fxCode], account.balance)
    return total
  }, {} as TFxAmount)
)
