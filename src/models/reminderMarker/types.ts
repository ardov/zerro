import { TAccountId } from 'models/account'
import { TInstrumentId } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { TReminderId } from 'models/reminder'
import { TTagId } from 'models/tag'
import { TUserId } from 'models/user'
import {
  Modify,
  TISODate,
  TMilliUnits,
  TMsTime,
  TUnits,
  TUnixTime,
} from 'shared/types'

export type TReminderMarkerId = string

export type TZmReminderMarker = {
  id: TReminderMarkerId // UUID
  changed: TUnixTime
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
  state: 'planned' | 'processed' | 'deleted'
  notify: boolean
}
export type TReminderMarker = Modify<
  TZmReminderMarker,
  {
    changed: TMsTime
    income: TMilliUnits
    outcome: TMilliUnits
  }
>
