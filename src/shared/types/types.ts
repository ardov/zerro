import { ById } from './ts-utils'
import { goalType } from 'models/hiddenData/constants'
import {
  IZmDiff,
  IZmDeletionObject,
  ITransaction,
  IReminder,
  IReminderMarker,
  IInstrument,
  ICountry,
  ICompany,
  IUser,
  IMerchant,
  IAccount,
  ITag,
  IBudget,
  TInstrumentId,
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

export type TLocalData = Omit<IZmDiff, 'deletion'>

// prettier-ignore
export type TDataStore = {
  serverTimestamp:  TMsTime
  instrument:       ById<IInstrument>
  country:          ById<ICountry>
  company:          ById<ICompany>
  user:             ById<IUser>
  merchant:         ById<IMerchant>
  account:          ById<IAccount>
  tag:              ById<ITag>
  budget:           ById<IBudget>
  reminder:         ById<IReminder>
  reminderMarker:   ById<IReminderMarker>
  transaction:      ById<ITransaction>
}

export type TDataStorePatch = Partial<TDataStore> & {
  deletion?: IZmDeletionObject[]
}
