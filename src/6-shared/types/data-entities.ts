import type { TUnixTime, TUnits, TISODate, TMsTime } from './types'
import type {
  TFxCode,
  TInstrument,
  TInstrumentId,
  TZmInstrument,
} from 'core-next/zenmoney/instruments/types'
import type {
  TCompany,
  TCompanyId,
  TZmCompany,
} from 'core-next/zenmoney/companies/types'
import type {
  TCountry,
  TCountryId,
  TZmCountry,
} from 'core-next/zenmoney/countries/types'
import type { TUser, TUserId, TZmUser } from 'core-next/zenmoney/users/types'
import type {
  TAccount,
  TAccountId,
  TZmAccount,
} from 'core-next/zenmoney/accounts/types'
import type { TTag, TTagId, TZmTag } from 'core-next/zenmoney/tags/types'
import type {
  TTransaction,
  TTransactionId,
  TZmTransaction,
} from 'core-next/zenmoney/transactions/types'

export type {
  TFxCode,
  TInstrument,
  TInstrumentId,
  TZmInstrument,
} from 'core-next/zenmoney/instruments/types'
export type {
  TCompany,
  TCompanyId,
  TZmCompany,
} from 'core-next/zenmoney/companies/types'
export type {
  TCountry,
  TCountryId,
  TZmCountry,
} from 'core-next/zenmoney/countries/types'
export type { TUser, TUserId, TZmUser } from 'core-next/zenmoney/users/types'
export type {
  TAccount,
  TAccountId,
  TZmAccount,
} from 'core-next/zenmoney/accounts/types'
export type { TTag, TTagId, TZmTag } from 'core-next/zenmoney/tags/types'
export type {
  TTransaction,
  TTransactionId,
  TZmTransaction,
} from 'core-next/zenmoney/transactions/types'
export { AccountType } from 'core-next/zenmoney/accounts/types'

// export type TToken = TAccessToken['access_token']

export enum DataEntity {
  Instrument = 'instrument',
  Country = 'country',
  Company = 'company',
  User = 'user',
  Account = 'account',
  Merchant = 'merchant',
  Tag = 'tag',
  Budget = 'budget',
  Reminder = 'reminder',
  ReminderMarker = 'reminderMarker',
  Transaction = 'transaction',
}

// ---------------------------------------------------------------------
// MERCHANT
// ---------------------------------------------------------------------

export type TMerchantId = string

export type TZmMerchant = {
  id: TMerchantId
  changed: TUnixTime
  user: TUserId
  title: string
}

export type TMerchant = TZmMerchant & {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// BUDGET
// ---------------------------------------------------------------------

export type TBudgetId = `${TISODate}#${TTagId}`

export const globalBudgetTagId = '00000000-0000-0000-0000-000000000000'

export type TZmBudget = {
  changed: TUnixTime
  user: TUserId
  tag: TTagId | '00000000-0000-0000-0000-000000000000' | null
  date: TISODate
  income: TUnits
  incomeLock: boolean
  outcome: TUnits
  outcomeLock: boolean
}

export type TBudget = TZmBudget & {
  changed: TMsTime
  id: TBudgetId // new
}

// ---------------------------------------------------------------------
// REMINDER
// ---------------------------------------------------------------------

export type TReminderId = string

export type TZmReminder = {
  id: TReminderId
  changed: TUnixTime
  user: TUserId
  incomeInstrument: TInstrumentId
  incomeAccount: string
  income: TUnits
  outcomeInstrument: TInstrumentId
  outcomeAccount: string
  outcome: TUnits
  tag: string[] | null
  merchant: TMerchantId | null
  payee: string | null
  comment: string | null
  interval: 'day' | 'week' | 'month' | 'year' | null
  step: number | null
  points: number[] | null
  startDate: TISODate
  endDate: TISODate
  notify: boolean
}

export type TReminder = TZmReminder & {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// REMINDER_MARKER
// ---------------------------------------------------------------------

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

export type TReminderMarker = TZmReminderMarker & {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// DELETION
// ---------------------------------------------------------------------

export type TZmDeletionObject = {
  id: string | number
  object: DataEntity
  stamp: TUnixTime
  user: TUserId
}

export type TDeletionObject = TZmDeletionObject & {
  stamp: TMsTime
}

// ---------------------------------------------------------------------
// DIFF
// ---------------------------------------------------------------------

export type TZmDiff = {
  serverTimestamp: TUnixTime
  deletion?: TZmDeletionObject[]
  instrument?: TZmInstrument[]
  country?: TZmCountry[]
  company?: TZmCompany[]
  user?: TZmUser[]
  merchant?: TZmMerchant[]
  account?: TZmAccount[]
  tag?: TZmTag[]
  budget?: TZmBudget[]
  reminder?: TZmReminder[]
  reminderMarker?: TZmReminderMarker[]
  transaction?: TZmTransaction[]
}

export type TDiff = {
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
  forceFetch?: DataEntity[]
}
