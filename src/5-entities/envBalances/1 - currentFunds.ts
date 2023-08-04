import { createSelector } from '@reduxjs/toolkit'
import { accountModel } from '5-entities/account'
import { addFxAmount } from '6-shared/helpers/money'
import { TFxAmount } from '6-shared/types'
import { TSelector } from 'store/index'

export const getCurrentFunds: TSelector<TFxAmount> = createSelector(
  [accountModel.getInBudgetAccounts],
  accounts =>
    accounts.reduce((sum, a) => addFxAmount(sum, { [a.fxCode]: a.balance }), {})
)
