import { Modify } from 'types'
import { TZmAccount } from './models/account'
import { TZmBudget } from './models/budget'
import { TISODate, TUnixTime } from './models/common'
import { TZmCompany } from './models/company'
import { TZmCountry } from './models/country'
import { TZmInstrument } from './models/instrument'
import { TZmMerchant } from './models/merchant'
import { TZmReminder } from './models/reminder'
import { TZmReminderMarker } from './models/reminderMarker'
import { TZmTag } from './models/tag'
import { TZmTransaction } from './models/transaction'
import { TUserId, TZmUser } from './models/user'

export type TObjectClass =
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

export type TZmDeletionObject = {
  id: string | number
  object: TObjectClass
  stamp: TUnixTime
  user: TUserId
}

export type TDeletionObject = Modify<
  TZmDeletionObject,
  {
    stamp: TISODate
  }
>

export type TZmDiff = {
  serverTimestamp: TUnixTime
  deletion?: TZmDeletionObject[]

  instrument?: TZmInstrument[]
  country?: TZmCountry[]
  company?: TZmCompany[]
  user?: TZmUser[]
  account?: TZmAccount[]
  merchant?: TZmMerchant[]
  tag?: TZmTag[]
  budget?: TZmBudget[]
  reminder?: TZmReminder[]
  reminderMarker?: TZmReminderMarker[]
  transaction?: TZmTransaction[]
}

export type TZmRequest = TZmDiff & {
  currentClientTimestamp: TUnixTime
  forceFetch?: TObjectClass[]
}
