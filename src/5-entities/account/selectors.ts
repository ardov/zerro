import { createSelector } from '@reduxjs/toolkit'
import { populate } from './shared/populate'
import { AccountType, ById } from '6-shared/types'
import { RootState } from 'store'
import { getInstCodeMap } from '5-entities/currency/instrument/model'
import { TAccountPopulated } from './shared/populate'
// Import the constant from Core Next directly: going through the hidden-store
// barrel creates a module cycle (hidden-store -> dataAccount -> account selectors).
import { ZERRO_DATA_ACCOUNT_NAME as DATA_ACC_NAME } from 'core-next'

// SELECTORS

export const getAccounts = (state: RootState) => state.data.current.account

export const getDebtAccountId = createSelector([getAccounts], accounts => {
  for (const id in accounts) {
    if (accounts[id].type === AccountType.Debt) return id
  }
})

export const getPopulatedAccounts = createSelector(
  [getAccounts, getInstCodeMap],
  (accounts, fxIdMap) => {
    const result: ById<TAccountPopulated> = {}
    for (const id in accounts) {
      result[id] = populate(accounts[id], fxIdMap)
    }
    return result
  }
)

export const getAccountList = createSelector([getPopulatedAccounts], accounts =>
  Object.values(accounts)
)

export const getInBudgetAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(a => a.inBudget)
)

export const getSavingAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(
    acc => !acc.inBudget && acc.type !== 'debt' && acc.title !== DATA_ACC_NAME
  )
)
