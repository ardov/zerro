import { toISODate } from '../../shared/date'
import type { Modify, OptionalExceptFor } from '../../shared/types'
import type { TCoreContext } from '../../types'
import type { TDateDraft } from '../primitives'
import { AccountType, type TAccount, type TAccountId } from './types'

export type TAccountFactoryDraft = Modify<
  OptionalExceptFor<TAccount, 'user' | 'instrument' | 'title'>,
  { startDate?: TDateDraft | null }
>

export function makeAccount(
  draft: TAccountFactoryDraft,
  ctx: TCoreContext
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
    balanceCorrectionType: draft.balanceCorrectionType || null,
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
