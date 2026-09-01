import { toISODate } from '../../foundation/date'
import type {
  EntityPatch,
  ById,
  Modify,
  OptionalExceptFor,
  TOpenEnum,
} from '../../foundation/types'
import type { TCoreContext } from '../../../../types'
import type { TAccountId } from './accounts'
import type { TInstrumentId } from './instruments'
import type { TMerchantId } from './merchants'
import type {
  TISODate,
  TMsTime,
  TUnixTime,
  TUnits,
  TDateDraft,
} from '../../foundation/primitives'
import type { TTagId } from './tags'
import { getRootUserId } from './users'
import type { TUser, TUserId } from './users'

export type TReminderId = string

export const reminderIntervals = ['day', 'week', 'month', 'year'] as const

export type TReminderInterval = TOpenEnum<(typeof reminderIntervals)[number]>

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
  endDate: TISODate | null
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

export type TReminderIntent = {
  deletion?: Array<{ id: TReminderId; object: 'reminder' }>
  reminder?: TReminderPatch[]
}

export type TReminderFactoryDraft = Modify<
  OptionalExceptFor<TReminder, 'user' | 'incomeAccount' | 'outcomeAccount'>,
  {
    startDate?: TDateDraft
    endDate?: TDateDraft | null
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

    id: draft.id ?? (ctx.uuid() as TReminderId),
    changed: draft.changed ?? ctx.now(),

    incomeInstrument: draft.incomeInstrument ?? 2,
    income: draft.income ?? 0,
    outcomeInstrument: draft.outcomeInstrument ?? 2,
    outcome: draft.outcome ?? 0,

    tag: draft.tag ?? null,
    merchant: draft.merchant ?? null,
    payee: draft.payee ?? null,
    comment: draft.comment ?? null,

    interval: draft.interval ?? null,
    step: draft.step === undefined ? 0 : draft.step,
    points: draft.points === undefined ? [0] : draft.points,
    startDate: toISODate(draft.startDate ?? ctx.now()),
    endDate:
      draft.endDate === null ? null : toISODate(draft.endDate ?? ctx.now()),
    notify: draft.notify ?? false,
  }
}

export type TReminderDraft = Modify<
  Omit<TReminderFactoryDraft, 'user'>,
  { startDate?: TDateDraft; endDate?: TDateDraft | null }
>

export function compileSetReminder(
  data: { reminders: ById<TReminder>; users: ById<TUser> },
  draft:
    TReminderDraft | TReminderPatch | Array<TReminderDraft | TReminderPatch>,
  ctx: TCoreContext
): TReminderIntent {
  const list = Array.isArray(draft) ? draft : [draft]

  return {
    reminder: list.map(item => {
      // Update: pass the sparse patch through; issue keeps only changed fields.
      if (item.id && data.reminders[item.id]) {
        const {
          changed: _ignored,
          startDate,
          endDate,
          ...fields
        } = item as TReminderDraft
        const patch: TReminderPatch = { ...fields, id: item.id }
        if (startDate !== undefined) patch.startDate = toISODate(startDate)
        if (endDate !== undefined) {
          patch.endDate = endDate === null ? null : toISODate(endDate)
        }
        return patch
      }

      // Creation: the factory captures generated ids and defaults at issue time.
      const user = getRootUserId(data.users)
      if (!user) throw new Error('User is not defined')
      if (!item.incomeAccount || !item.outcomeAccount) {
        throw new Error('Missing incomeAccount or outcomeAccount')
      }

      return makeReminder({ ...item, user } as TReminderFactoryDraft, ctx)
    }),
  }
}

export function compileDeleteReminder(
  reminders: ById<TReminder>,
  id: TReminderId
): TReminderIntent {
  if (!reminders[id]) return {}

  return {
    deletion: [{ id, object: 'reminder' }],
  }
}
