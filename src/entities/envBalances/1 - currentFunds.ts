import { createSelector } from '@reduxjs/toolkit'
import { accountModel } from '@entities/account'
import { addFxAmount } from '@shared/helpers/money'
import { TFxAmount } from '@shared/types'
import { TSelector } from '@store/index'

export const getCurrentFunds: TSelector<TFxAmount> = createSelector(
  [accountModel.getInBudgetAccounts],
  accounts =>
    accounts.reduce((sum, a) => addFxAmount(sum, { [a.fxCode]: a.balance }), {})
)
