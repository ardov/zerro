import type { TAccountId } from '../accounts'
import type { TInstrumentId } from '../instruments'
import type { TMerchantId } from '../merchants'
import type { TISODate, TMsTime, TUnixTime, TUnits } from '../primitives'
import type { TReminderId } from '../reminders'
import type { TTagId } from '../tags'
import type { TUserId } from '../users'

export type TReminderMarkerId = string

export type TReminderMarkerState = 'planned' | 'processed' | 'deleted'

export type TReminderMarker = {
  id: TReminderMarkerId

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
  date: TISODate
  reminder: TReminderId
  state: TReminderMarkerState
  notify: boolean
}

export type TZmReminderMarker = Omit<TReminderMarker, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}
