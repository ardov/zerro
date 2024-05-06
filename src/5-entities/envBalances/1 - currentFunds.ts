import type { TSelector } from 'store/index'
import type { TFxAmount } from '6-shared/types'

import { createSelector } from '@reduxjs/toolkit'
import { addFxAmount } from '6-shared/helpers/money'
import { accountModel } from '5-entities/account'

export const getCurrentFunds: TSelector<TFxAmount> = createSelector(
  [accountModel.getInBudgetAccounts],
  accounts => {
    const balances = accounts.map(a => ({ [a.fxCode]: a.balance } as TFxAmount))
    return addFxAmount(...balances)
  }
)
