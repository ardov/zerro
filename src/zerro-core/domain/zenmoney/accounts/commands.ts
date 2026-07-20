import type { TDataStore } from '../store'
import {
  DataEntity,
  type TCoreContext,
  type TNormalizedPatch,
} from '../../../types'
import { getRootUserId } from '../users'
import { makeAccount, type TAccountFactoryDraft } from './factory'
import { getAccounts } from './read'
import type { TAccountId, TAccountPatch } from './types'

export type TAccountDraft = Omit<TAccountFactoryDraft, 'user'>

export function compileCreateAccount(
  data: TDataStore,
  draft: TAccountDraft,
  ctx: TCoreContext
): TNormalizedPatch {
  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    account: [makeAccount({ ...draft, user }, ctx)],
  }
}

export function compilePatchAccount(
  data: TDataStore,
  patch: TAccountPatch | TAccountPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(patch) ? patch : [patch]

  return {
    account: list.map(item => {
      if (!item.id) throw new Error('Trying to patch account without id')

      const current = getAccounts(data)[item.id]
      if (!current) throw new Error('Account not found')

      return { ...current, ...item, changed: ctx.now() }
    }),
  }
}

export function compileDeleteAccount(
  data: TDataStore,
  id: TAccountId,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  if (!getAccounts(data)[id]) throw new Error('Account not found')

  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    deletion: [
      {
        id,
        object: DataEntity.Account,
        stamp: ctx.now(),
        user,
      },
    ],
  }
}
