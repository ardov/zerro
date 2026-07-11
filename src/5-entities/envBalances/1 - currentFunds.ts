import type { TSelector } from 'store/index'
import type { TFxAmount } from '6-shared/types'

import { createSelector } from '@reduxjs/toolkit'
import { addFxAmount } from '6-shared/helpers/money'
import { getInBudgetAccounts } from '5-entities/account/selectors'

export const getCurrentFunds: TSelector<TFxAmount> = createSelector(
  [getInBudgetAccounts],
  accounts => {
    const balances = accounts.map(a => ({ [a.fxCode]: a.balance }) as TFxAmount)
    return addFxAmount(...balances)
  }
)
