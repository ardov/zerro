import { RootState, TSelector } from 'store'
import { getItemsCount } from './shared/getItemsCount'
import { getLastDiffChange } from './shared/getLastDiffChange'
import { AccountType, TAccountId } from '6-shared/types'
import { createSelector } from '@reduxjs/toolkit'

export const getDiff = (state: RootState) => state.data.diff

export const getChangedNum = (state: RootState) => {
  return getItemsCount(getDiff(state))
}

export const getLastChangeTime = (state: RootState) => {
  return getLastDiffChange(getDiff(state))
}

export const getLastSyncTime = (state: RootState) => {
  return state.data.current.serverTimestamp
}

export const getRootUserId = (state: RootState) => {
  const users = state.data.current.user
  for (const id in users) {
    if (!users[id].parent) return id
  }
  console.warn('No root user found')
  return 'null_root_user'
}

export const getDebtAccountId: TSelector<TAccountId> = createSelector(
  [state => state.data.current.account],
  accounts => {
    for (const id in accounts) {
      if (accounts[id].type === AccountType.Debt) return id
    }
    console.warn('No debt account found')
    return 'null_debt_account'
  }
)
