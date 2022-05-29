import { UserId } from './User'
import { InstrumentId, TFxCode } from './Instrument'
import { AccountId } from './Account'
import { TagId } from './Tag'
import { MerchantId } from './Merchant'
import { ReminderId } from './Reminder'
import { TISODate, TMilliUnits, TUnits, TUnixTime } from './common'
import { Modify } from '../ts-utils'

export type ZmReminderMarkerId = string

export type ZmReminderMarker = {
  id: ZmReminderMarkerId // UUID
  changed: TUnixTime
  user: UserId
  incomeInstrument: InstrumentId
  incomeAccount: AccountId
  income: TUnits
  outcomeInstrument: InstrumentId
  outcomeAccount: AccountId
  outcome: TUnits
  tag: TagId[] | null
  merchant: MerchantId | null
  payee: string | null
  comment: string | null
  date: TISODate
  reminder: ReminderId
  state: 'planned' | 'processed' | 'deleted'
  notify: boolean
}

export type TReminderMarker = Modify<
  ZmReminderMarker,
  {
    changed: TISOTimestamp
    income: TMilliUnits
    outcome: TMilliUnits
    // Custom
    incomeFxCode: TFxCode
    outcomeFxCode: TFxCode
  }
>
