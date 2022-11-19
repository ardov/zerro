import { createSelector } from '@reduxjs/toolkit'
import { populate } from './shared/populate'
import { AccountType, ById } from '@shared/types'
import { RootState } from '@store'
import { getFxIdMap } from '@entities/instrument'
import { TAccountPopulated } from './shared/populate'
import { DATA_ACC_NAME } from '../old-hiddenData/constants'

// SELECTORS

export const getAccounts = (state: RootState) => state.data.current.account

export const getDebtAccountId = createSelector([getAccounts], accounts => {
  for (const id in accounts) {
    if (accounts[id].type === AccountType.Debt) return id
  }
})

export const getPopulatedAccounts = createSelector(
  [getAccounts, getFxIdMap],
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
