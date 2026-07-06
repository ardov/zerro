import { toISODate } from '6-shared/helpers/date'
import type {
  Modify,
  OptionalExceptFor,
  TAccount,
  TAccountId,
  TDataStore,
  TDateDraft,
} from '6-shared/types'
import { AccountType, DataEntity } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { getRootUserId } from '../users'

export type TZenMoneyAccountPatch = OptionalExceptFor<TAccount, 'id'>
export type TZenMoneyAccountDraft = Modify<
  OptionalExceptFor<TAccount, 'instrument' | 'title'>,
  { startDate?: TDateDraft }
>

export function compileCreateAccount(
  data: TDataStore,
  draft: TZenMoneyAccountDraft,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  const user = getRootUserId(data)
  if (!user) throw new Error('No user')

  return {
    account: [makeAccount({ ...draft, user }, ctx)],
  }
}

export function compilePatchAccount(
  data: TDataStore,
  patch: TZenMoneyAccountPatch | TZenMoneyAccountPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(patch) ? patch : [patch]

  return {
    account: list.map(item => {
      if (!item.id) throw new Error('Trying to patch account without id')

      const current = data.account[item.id]
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
  if (!data.account[id]) throw new Error('Account not found')

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

function makeAccount(
  draft: TZenMoneyAccountDraft & Pick<TAccount, 'user'>,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TAccount {
  return {
    user: draft.user,
    instrument: draft.instrument,
    title: draft.title,

    id: draft.id || (ctx.uuid() as TAccountId),
    changed: draft.changed || ctx.now(),
    role: draft.role || null,
    company: draft.company || null,
    type: draft.type || AccountType.Cash,
    syncID: draft.syncID || null,

    balance: draft.balance || 0,
    startBalance: draft.startBalance || 0,
    creditLimit: draft.creditLimit || 0,

    inBalance: draft.inBalance || false,
    savings: draft.savings || false,
    enableCorrection: draft.enableCorrection || false,
    enableSMS: draft.enableSMS || false,
    archive: draft.archive || false,
    private: draft.private || false,

    capitalization: draft.capitalization || null,
    percent: draft.percent || null,
    startDate: draft.startDate ? toISODate(draft.startDate) : null,
    endDateOffset: draft.endDateOffset || null,
    endDateOffsetInterval: draft.endDateOffsetInterval || null,
    payoffStep: draft.payoffStep || null,
    payoffInterval: draft.payoffInterval || null,
  }
}
