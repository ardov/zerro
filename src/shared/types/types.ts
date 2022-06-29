import { ById } from './ts-utils'
import { goalType } from 'models/hiddenData/constants'
import { TZmDiff } from 'shared/api/zenmoney'
import { TZmDeletionObject } from 'models/deletion'
import { TTransaction } from 'models/transaction'
import { TReminder } from 'models/reminder'
import { TReminderMarker } from 'models/reminderMarker'
import { TInstrument, TInstrumentId } from 'models/instrument'
import { TCountry } from 'models/country'
import { TCompany } from 'models/company'
import { TUser } from 'models/user'
import { TMerchant } from 'models/merchant'
import { TAccount } from 'models/account'
import { TTag } from 'models/tag'
import { TBudget } from 'models/budget'

type TYear = `${number}${number}${number}${number}`
type TMonth = `${number}${number}`
type TDate = `${number}${number}`
export type TISOMonth = `${TYear}-${TMonth}` // 2000-01
export type TISODate = `${TYear}-${TMonth}-${TDate}` // 2000-01-01

export type TUnixTime = number
export type TMsTime = number
export type TISOTimestamp = string // 2000-01-01T00:00:00.000Z

export type TDateDraft = number | TISOMonth | TISODate | Date

export type TUnits = number
export type TMilliUnits = number

export type TToken = string | null

// ---------------------------------------------------------------------
// Other
// ---------------------------------------------------------------------

export type TTagMeta = {
  comment?: string
  currency?: TInstrumentId
}

export type TGoal = {
  type: goalType
  amount: number
  end?: TISODate
}

export type TLocalData = Omit<TZmDiff, 'deletion'>

// prettier-ignore
export type TDataStore = {
  serverTimestamp:  TMsTime
  instrument:       ById<TInstrument>
  country:          ById<TCountry>
  company:          ById<TCompany>
  user:             ById<TUser>
  merchant:         ById<TMerchant>
  account:          ById<TAccount>
  tag:              ById<TTag>
  budget:           ById<TBudget>
  reminder:         ById<TReminder>
  reminderMarker:   ById<TReminderMarker>
  transaction:      ById<TTransaction>
}

export type TDataStorePatch = Partial<TDataStore> & {
  deletion?: TZmDeletionObject[]
}
