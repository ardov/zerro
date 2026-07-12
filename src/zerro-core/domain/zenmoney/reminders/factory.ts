import { toISODate } from '../../shared/date'
import type { Modify, OptionalExceptFor } from '../../shared/types'
import type { TCoreContext } from '../../../types'
import type { TDateDraft } from '../primitives'
import type { TReminder, TReminderId } from './types'

export type TReminderFactoryDraft = Modify<
  OptionalExceptFor<TReminder, 'user' | 'incomeAccount' | 'outcomeAccount'>,
  {
    startDate?: TDateDraft
    endDate?: TDateDraft
  }
>

export function makeReminder(
  draft: TReminderFactoryDraft,
  ctx: TCoreContext
): TReminder {
  return {
    user: draft.user,
    incomeAccount: draft.incomeAccount,
    outcomeAccount: draft.outcomeAccount,

    id: draft.id || (ctx.uuid() as TReminderId),
    changed: draft.changed || ctx.now(),

    incomeInstrument: draft.incomeInstrument || 2,
    income: draft.income || 0,
    outcomeInstrument: draft.outcomeInstrument || 2,
    outcome: draft.outcome || 0,

    tag: draft.tag || null,
    merchant: draft.merchant || null,
    payee: draft.payee || null,
    comment: draft.comment || null,

    interval: draft.interval || null,
    step: draft.step || 0,
    points: draft.points || [0],
    startDate: toISODate(draft.startDate || ctx.now()),
    endDate: toISODate(draft.endDate || ctx.now()),
    notify: draft.notify || false,
  }
}
