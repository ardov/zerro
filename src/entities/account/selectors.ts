import { createSelector } from '@reduxjs/toolkit'
import { populate } from './populate'
import { convertCurrency, getInstruments } from '@entities/instrument'
import { IAccountPopulated } from './types'
import { AccountType, TAccountId } from '@shared/types'
import { RootState } from '@store'
import { DATA_ACC_NAME } from '../old-hiddenData/constants'

// SELECTORS

export const getAccounts = (state: RootState) => state.data.current.account

export const getDebtAccountId = createSelector([getAccounts], accounts => {
  for (const id in accounts) {
    if (accounts[id].type === AccountType.Debt) return id
  }
})

export const getPopulatedAccounts = createSelector(
  [convertCurrency, getAccounts, getInstruments],
  (convert, accounts, instruments) => {
    const result: Record<TAccountId, IAccountPopulated> = {}
    for (const id in accounts) {
      result[id] = populate({ convert, instruments }, accounts[id])
    }
    return result
  }
)

export const getAccountList = createSelector([getPopulatedAccounts], accounts =>
  Object.values(accounts).sort(
    (a, b) => b.convertedBalance - a.convertedBalance
  )
)

export const getInBudgetAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(a => a.inBudget)
)

export const getSavingAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(
    acc => !acc.inBudget && acc.type !== 'debt' && acc.title !== DATA_ACC_NAME
  )
)
