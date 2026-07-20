import { toISODate } from '../../foundation/date'
import type { ById, Modify, OptionalExceptFor } from '../../foundation/types'
import type { TCoreContext } from '../../../../types'
import type { TAccountId } from './accounts'
import type { TInstrumentId } from './instruments'
import type { TMerchantId } from './merchants'
import type {
  TDateDraft,
  TISODate,
  TMsTime,
  TUnixTime,
  TUnits,
} from '../../foundation/primitives'
import type { TReminderId } from './reminders'
import type { TTagId } from './tags'
import type { TUserId } from './users'

export type TReminderMarkerId = string
export type TReminderMarkerState = 'planned' | 'processed' | 'deleted'
export type TReminderMarker = {
  id: TReminderMarkerId
  changed: TMsTime
  user: TUserId
  incomeInstrument: TInstrumentId
  incomeAccount: TAccountId
  income: TUnits
  outcomeInstrument: TInstrumentId
  outcomeAccount: TAccountId
  outcome: TUnits
  tag: TTagId[] | null
  merchant: TMerchantId | null
  payee: string | null
  comment: string | null
  date: TISODate
  reminder: TReminderId
  state: TReminderMarkerState
  notify: boolean
}
export type TZmReminderMarker = Omit<TReminderMarker, 'changed'> & {
  changed: TUnixTime
}
export type TReminderMarkerFactoryDraft = Modify<
  OptionalExceptFor<
    TReminderMarker,
    'user' | 'incomeAccount' | 'outcomeAccount' | 'date' | 'reminder'
  >,
  { date: TDateDraft }
>
export type TReminderMarkerSource = {
  reminderMarker: ById<TReminderMarker>
}

export function getReminderMarkers(
  data: TReminderMarkerSource
): ById<TReminderMarker> {
  return data.reminderMarker
}
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
