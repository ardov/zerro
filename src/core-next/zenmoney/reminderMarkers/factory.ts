import { toISODate } from '../../shared/date'
import type { Modify, OptionalExceptFor } from '../../shared/types'
import type { TCoreContext } from '../../types'
import type { TDateDraft } from '../primitives'
import type { TReminderMarker, TReminderMarkerId } from './types'

export type TReminderMarkerFactoryDraft = Modify<
  OptionalExceptFor<
    TReminderMarker,
    'user' | 'incomeAccount' | 'outcomeAccount' | 'date' | 'reminder'
  >,
  { date: TDateDraft }
>

export function makeReminderMarker(
  draft: TReminderMarkerFactoryDraft,
  ctx: TCoreContext
): TReminderMarker {
  return {
    user: draft.user,
    incomeAccount: draft.incomeAccount,
    outcomeAccount: draft.outcomeAccount,
    date: toISODate(draft.date),
    reminder: draft.reminder,

    id: draft.id || (ctx.uuid() as TReminderMarkerId),
    changed: draft.changed || ctx.now(),

    incomeInstrument: draft.incomeInstrument || 2,
    income: draft.income || 0,
    outcomeInstrument: draft.outcomeInstrument || 2,
    outcome: draft.outcome || 0,

    tag: draft.tag || null,
    merchant: draft.merchant || null,
    payee: draft.payee || null,
    comment: draft.comment || null,
    state: draft.state || 'planned',
    notify: draft.notify || false,
  }
}
