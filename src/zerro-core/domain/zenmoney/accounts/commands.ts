import type { TDataStore } from '../store'
import {
  DataEntity,
  type TCoreContext,
  type TIntentPatch,
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
): TIntentPatch {
  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    account: [makeAccount({ ...draft, user }, ctx)],
  }
}

export function compilePatchAccount(
  data: TDataStore,
  patch: TAccountPatch | TAccountPatch[]
): TIntentPatch {
  const list = Array.isArray(patch) ? patch : [patch]

  list.forEach(item => {
    if (!item.id) throw new Error('Trying to patch account without id')
    if (!getAccounts(data)[item.id]) throw new Error('Account not found')
  })

  return { account: list }
}

export function compileDeleteAccount(
  data: TDataStore,
  id: TAccountId
): TIntentPatch {
  if (!getAccounts(data)[id]) throw new Error('Account not found')

  return {
    deletion: [{ id, object: DataEntity.Account }],
  }
}
