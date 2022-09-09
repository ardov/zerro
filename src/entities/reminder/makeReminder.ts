import { v1 as uuidv1 } from 'uuid'
import { TReminder } from '@shared/types'
import { toISODate } from '@shared/helpers/date'
import { Modify, OptionalExceptFor, TDateDraft } from '@shared/types'

type ReminderDraft = Modify<
  OptionalExceptFor<TReminder, 'user' | 'incomeAccount' | 'outcomeAccount'>,
  {
    startDate?: TDateDraft
    endDate?: TDateDraft
  }
>

export function makeReminder(draft: ReminderDraft): TReminder {
  return {
    // Required
    user: draft.user,
    incomeAccount: draft.incomeAccount,
    outcomeAccount: draft.outcomeAccount,

    // Optional
    id: draft.id || uuidv1(),
    changed: draft.changed || Date.now(),

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
    startDate: toISODate(draft.startDate || Date.now()),
    endDate: toISODate(draft.endDate || Date.now()),
    notify: draft.notify || false,
  }
}
