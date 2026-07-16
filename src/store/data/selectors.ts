import { RootState, TSelector } from 'store'
import { getItemsCount } from './shared/getItemsCount'
import { AccountType, TAccountId, TDiff } from '6-shared/types'
import { createSelector } from '@reduxjs/toolkit'
import {
  getMaterializedOutboxPatches,
  getPendingOutbox,
  isOutboxEntryRebaseSafe,
} from 'zerro-core/infrastructure/replica/outbox'
import { immutableMergeDiffs } from './shared/mergeDiffs'

const getBase = (state: RootState) => state.data.base
const getOutbox = (state: RootState) => state.data.outbox
const getOutboxHead = (state: RootState) => state.data.outboxHead

const getPendingEntries = createSelector(
  [getOutbox, getOutboxHead],
  getPendingOutbox
)

export const getPendingSyncDiff = createSelector(
  [getBase, getOutbox, getOutboxHead],
  (base, outbox, outboxHead) =>
    mergeMaterializedPatches(
      getMaterializedOutboxPatches(base, outbox, outboxHead)
    )
)

export function getPendingSyncTransport(
  state: RootState,
  changedAt: number
): TDiff | undefined {
  return mergeMaterializedPatches(
    getMaterializedOutboxPatches(
      state.data.base,
      state.data.outbox,
      state.data.outboxHead,
      changedAt
    )
  )
}

export const getHasPendingChanges = (state: RootState) =>
  getOutboxHead(state) > 0

export const getHasBlockingSyncChanges = createSelector(
  [getPendingEntries],
  entries => entries.some(entry => !isOutboxEntryRebaseSafe(entry))
)

export const getCanUndoClientCommand = (state: RootState) =>
  !state.isPending && getOutboxHead(state) > 0

export const getCanRedoClientCommand = (state: RootState) =>
  !state.isPending && getOutboxHead(state) < getOutbox(state).length

export const getChangedNum = (state: RootState) => {
  return getItemsCount(getPendingSyncDiff(state))
}

export const getLastChangeTime = createSelector([getPendingEntries], outbox =>
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

function mergeMaterializedPatches(patches: TDiff[]): TDiff | undefined {
  if (!patches.length) return undefined
  return patches.reduce<TDiff>(immutableMergeDiffs, {})
}
