import { toISODate } from '../shared/date'
import type {
  EntityPatch,
  ById,
  Modify,
  OptionalExceptFor,
} from '../shared/types'
import type { TCoreContext, TIntentPatch } from '../../types'
import type { TAccountId } from './accounts'
import type { TInstrumentId } from './instruments'
import type { TMerchantId } from './merchants'
import type {
  TISODate,
  TMsTime,
  TUnixTime,
  TUnits,
  TDateDraft,
} from './primitives'
import type { TDataStore } from './store'
import type { TTagId } from './tags'
import { getRootUserId } from './users'
import type { TUserId } from './users'

export type TReminderId = string

export type TReminderInterval = 'day' | 'week' | 'month' | 'year'

export type TReminder = {
  id: TReminderId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
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
  interval: TReminderInterval | null
  step: number | null
  points: number[] | null
  startDate: TISODate
  endDate: TISODate
  notify: boolean
}

/** Fields the factory cannot default: creation intent must supply them. */
export const reminderRequiredFields = [
  'incomeAccount',
  'outcomeAccount',
] as const satisfies readonly (keyof TReminder)[]

export const reminderWritableFields = [
  'incomeInstrument',
  'incomeAccount',
  'income',
  'outcomeInstrument',
  'outcomeAccount',
  'outcome',
  'tag',
  'merchant',
  'payee',
  'comment',
  'interval',
  'step',
  'points',
  'startDate',
  'endDate',
  'notify',
] as const satisfies readonly (keyof TReminder)[]

export type TReminderWritableField = (typeof reminderWritableFields)[number]

export type TReminderPatch = EntityPatch<TReminder, TReminderWritableField>

export type TZmReminder = Omit<TReminder, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}

export function getReminders(data: TDataStore): ById<TReminder> {
  return data.reminder
}

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

export type TReminderDraft = Modify<
  Omit<TReminderFactoryDraft, 'user'>,
  { startDate?: TDateDraft; endDate?: TDateDraft }
>

export function compileSetReminder(
  data: TDataStore,
  draft:
    TReminderDraft | TReminderPatch | Array<TReminderDraft | TReminderPatch>,
  ctx: TCoreContext
): TIntentPatch {
  const list = Array.isArray(draft) ? draft : [draft]

  return {
    reminder: list.map(item => {
      // Update: pass the sparse patch through; issue keeps only changed fields.
      if (item.id && getReminders(data)[item.id]) {
        const {
          changed: _ignored,
          startDate,
          endDate,
          ...fields
        } = item as TReminderDraft
        const patch: TReminderPatch = { ...fields, id: item.id }
        if (startDate !== undefined) patch.startDate = toISODate(startDate)
        if (endDate !== undefined) patch.endDate = toISODate(endDate)
        return patch
      }

      // Creation: the factory captures generated ids and defaults at issue time.
      const user = getRootUserId(data)
      if (!user) throw new Error('User is not defined')
      if (!item.incomeAccount || !item.outcomeAccount) {
        throw new Error('Missing incomeAccount or outcomeAccount')
      }

      return makeReminder({ ...item, user } as TReminderFactoryDraft, ctx)
    }),
  }
}

export function compileDeleteReminder(
  data: TDataStore,
  id: TReminderId
): TIntentPatch {
  if (!getReminders(data)[id]) return {}

  return {
    deletion: [{ id, object: 'reminder' }],
  }
}
