import type { RootState, TSelector } from 'store'
import { getItemsCount } from './shared/getItemsCount'
import type { TAccountId, TNormalizedPatch } from '6-shared/types'
import { AccountType } from '6-shared/types'
import { createSelector } from '@reduxjs/toolkit'
import {
  buildOutboxTransport,
  getMaterializedOutboxPatches,
} from 'zerro-core/replica'
import { immutableMergeDiffs } from './shared/mergeDiffs'

const getBase = (state: RootState) => state.data.base
const getOutbox = (state: RootState) => state.data.outbox
const getRedo = (state: RootState) => state.data.redo

export const getPendingSyncDiff = createSelector(
  [getBase, getOutbox],
  (base, outbox) =>
    mergeMaterializedPatches(getMaterializedOutboxPatches(base, outbox))
)

export function getPendingSyncTransport(
  state: RootState,
  sentAt: number
): TNormalizedPatch | undefined {
  return buildOutboxTransport(state.data.base, state.data.outbox, sentAt)
}

export const getHasPendingChanges = (state: RootState) =>
  getOutbox(state).length > 0

export const getCanUndoClientCommand = (state: RootState) =>
  !state.isPending && getOutbox(state).length > 0

export const getCanRedoClientCommand = (state: RootState) =>
  !state.isPending && getRedo(state).length > 0

export const getChangedNum = (state: RootState) => {
  return getItemsCount(getPendingSyncDiff(state))
}

export const getLastChangeTime = createSelector([getOutbox], outbox =>
  outbox.reduce((latest, command) => Math.max(latest, command.issuedAt), 0)
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

function mergeMaterializedPatches(
  patches: TNormalizedPatch[]
): TNormalizedPatch | undefined {
  if (!patches.length) return undefined
  return patches.reduce<TNormalizedPatch>(immutableMergeDiffs, {})
}
