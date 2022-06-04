import { Modify } from '..'
import { ZmAccount } from './Account'
import { ZmBudget } from './Budget'
import { TISODate, TUnixTime } from './common'
import { ZmCompany } from './Company'
import { ZmCountry } from './Country'
import { ZmInstrument } from './Instrument'
import { ZmMerchant } from './Merchant'
import { ZmReminder } from './Reminder'
import { ZmReminderMarker } from './ReminderMarker'
import { ZmTag } from './Tag'
import { ZmTransaction } from './Transaction'
import { UserId, ZmUser } from './User'

export type ObjectClass =
  | 'instrument'
  | 'country'
  | 'company'
  | 'user'
  | 'account'
  | 'merchant'
  | 'tag'
  | 'budget'
  | 'reminder'
  | 'reminderMarker'
  | 'transaction'

export type ZmDeletionObject = {
  id: string | number
  object: ObjectClass
  stamp: TUnixTime
  user: UserId
}

export type TDeletionObject = Modify<ZmDeletionObject, { stamp: TISODate }>

export interface ZmDiff {
  serverTimestamp: number // Unix timestamp
  deletion?: ZmDeletionObject[]

  instrument?: ZmInstrument[]
  country?: ZmCountry[]
  company?: ZmCompany[]
  user?: ZmUser[]
  account?: ZmAccount[]
  merchant?: ZmMerchant[]
  tag?: ZmTag[]
  budget?: ZmBudget[]
  reminder?: ZmReminder[]
  reminderMarker?: ZmReminderMarker[]
  transaction?: ZmTransaction[]
}

export interface ZmRequest extends ZmDiff {
  currentClientTimestamp: number // Unix timestamp
  forceFetch?: ObjectClass[]
}
