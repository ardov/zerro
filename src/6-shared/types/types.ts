import { ById } from './ts-utils'
import { oldGoalType } from '5-entities/old-hiddenData/constants'
import {
  TZmDiff,
  TZmDeletionObject,
  TTransaction,
  TReminder,
  TReminderMarker,
  TInstrument,
  TCountry,
  TCompany,
  TUser,
  TMerchant,
  TAccount,
  TTag,
  TBudget,
  TInstrumentId,
  TFxCode,
} from './data-entities'

type TYear = `${number}${number}${number}${number}`
type TMonth = `${number}${number}`
type TDate = `${number}${number}`
export type TISOMonth = `${TYear}-${TMonth}` // 2000-01
export type TISODate = `${TYear}-${TMonth}-${TDate}` // 2000-01-01

export type TUnixTime = number
export type TMsTime = number

export type TDateDraft = number | TISOMonth | TISODate | Date

export type TUnits = number
export type TMilliUnits = number

export type TToken = string | null

export type TFxAmount = Record<TFxCode, number>
export type TRates = Record<TFxCode, number>

// ---------------------------------------------------------------------
// Other
// ---------------------------------------------------------------------

export type TTagMeta = {
  comment?: string
  currency?: TInstrumentId
}

export type TOldGoal = {
  type: oldGoalType
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
