import { RootState, TSelector } from 'store'
import { getItemsCount } from './shared/getItemsCount'
import { AccountType, TAccountId, TDiff } from '6-shared/types'
import { createSelector } from '@reduxjs/toolkit'
import { getPendingOutbox } from 'core-next/engine/outbox'
import { immutableMergeDiffs } from './shared/mergeDiffs'

const getOutbox = (state: RootState) => state.data.outbox
const getOutboxHead = (state: RootState) => state.data.outboxHead

const getAppliedOutbox = createSelector(
  [getOutbox, getOutboxHead],
  getPendingOutbox
)

export const getPendingSyncDiff = createSelector([getAppliedOutbox], outbox => {
  if (!outbox.length) return undefined
  return outbox.reduce<TDiff>(
    (diff, entry) => immutableMergeDiffs(diff, entry.appliedPatch),
    {}
  )
})

export const getHasPendingChanges = (state: RootState) =>
  getOutboxHead(state) > 0

export const getChangedNum = (state: RootState) => {
  return getItemsCount(getPendingSyncDiff(state))
}

export const getLastChangeTime = createSelector([getAppliedOutbox], outbox =>
  outbox.reduce((latest, entry) => Math.max(latest, entry.createdAt), 0)
)

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
