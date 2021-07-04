import { createSelector } from '@reduxjs/toolkit'
import { populate } from './populate'
import { convertCurrency } from 'store/data/selectors'
import { Account, AccountId, PopulatedAccount } from 'types'
import { RootState } from 'store'
import { DATA_ACC_NAME } from '../hiddenData/constants'

// SELECTORS

export const getAccounts = (state: RootState) => state.data.current.account

export const getAccount = (state: RootState, id: AccountId) =>
  getAccounts(state)[id]

export const getPopulatedAccounts = createSelector(
  [convertCurrency, getAccounts],
  (convert, accounts) => {
    const result = {} as { [x: string]: PopulatedAccount }
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
  accounts.filter(isInBudget)
)

export const getSavingAccounts = createSelector([getAccountList], accounts =>
  accounts.filter(
    acc =>
      !isInBudget(acc) && acc.type !== 'debt' && acc.title !== DATA_ACC_NAME
  )
)

function isInBudget(a: Account) {
  if (a.type === 'debt') return false
  if (a.title.endsWith('📍')) return true
  return a.inBalance
}
