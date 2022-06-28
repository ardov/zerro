import { TAccount, TZmAccount } from 'models/account'
import { TBudget, TZmBudget } from 'models/budget'
import { TCompany, TZmCompany } from 'models/company'
import { TCountry, TZmCountry } from 'models/country'
import { EntityType, TDeletionObject, TZmDeletionObject } from 'models/deletion'
import { TInstrument, TZmInstrument } from 'models/instrument'
import { TMerchant, TZmMerchant } from 'models/merchant'
import { TReminder, TZmReminder } from 'models/reminder'
import { TReminderMarker, TZmReminderMarker } from 'models/reminderMarker'
import { TTag, TZmTag } from 'models/tag'
import { TTransaction, TZmTransaction } from 'models/transaction'
import { TUser, TZmUser } from 'models/user'
import { TMsTime, TUnixTime } from 'shared/types'

export interface TZmDiff {
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

export interface TDiff {
  serverTimestamp?: TMsTime
  deletion?: TDeletionObject[]
  instrument?: TInstrument[]
  country?: TCountry[]
  company?: TCompany[]
  user?: TUser[]
  account?: TAccount[]
  merchant?: TMerchant[]
  tag?: TTag[]
  budget?: TBudget[]
  reminder?: TReminder[]
  reminderMarker?: TReminderMarker[]
  transaction?: TTransaction[]
}

export type TZmRequest = TZmDiff & {
  currentClientTimestamp: TUnixTime
  forceFetch?: EntityType[]
}
