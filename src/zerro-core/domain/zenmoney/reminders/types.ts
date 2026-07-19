import type { EntityPatch } from '../../shared/types'
import type { TAccountId } from '../accounts'
import type { TInstrumentId } from '../instruments'
import type { TMerchantId } from '../merchants'
import type { TISODate, TMsTime, TUnixTime, TUnits } from '../primitives'
import type { TTagId } from '../tags'
import type { TUserId } from '../users'

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
