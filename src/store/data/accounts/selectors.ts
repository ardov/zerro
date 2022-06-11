import { createSelector } from '@reduxjs/toolkit'
import { populate } from './populate'
import { convertCurrency } from 'store/data/instruments'
import { TPopulatedAccount } from 'types'
import { RootState } from 'store'
import { DATA_ACC_NAME } from '../hiddenData/constants'

// SELECTORS

export const getAccounts = (state: RootState) => state.data.current.account

export const getPopulatedAccounts = createSelector(
  [convertCurrency, getAccounts],
  (convert, accounts) => {
    const result = {} as { [x: string]: TPopulatedAccount }
    for (const id in accounts) {
      result[id] = populate({ convert }, accounts[id])
    }
    return result
  }
)

export const getAccountList = createSelector([getPopulatedAccounts], accounts =>
  Object.values(accounts).sort(
    (a, b) => b.convertedBalance - a.convertedBalance
  )
)

export const getDebtAccountId = createSelector([getAccountList], accounts => {
  for (const acc of accounts) {
    if (acc.type === 'debt') return acc.id
  }
})

export const getInBudgetAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(a => a.inBudget)
)

export const getSavingAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(
    acc => !acc.inBudget && acc.type !== 'debt' && acc.title !== DATA_ACC_NAME
  )
)
