import { Modify } from './ts-utils'
import { TUnixTime, TUnits, TISODate, TMsTime } from './types'
import tagIcons from 'shared/tagIcons.json'

type TIconName = keyof typeof tagIcons

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
// INSTRUMENT
// ---------------------------------------------------------------------

export type TInstrumentId = number

export type TFxCode = string

export type TZmInstrument = {
  id: TInstrumentId
  changed: TUnixTime
  title: string
  shortTitle: TFxCode
  symbol: string
  rate: number
}

export type TInstrument = Modify<TZmInstrument, { changed: TMsTime }>

// ---------------------------------------------------------------------
// COUNTRY
// ---------------------------------------------------------------------

export type TCountryId = number

export type TZmCountry = {
  id: TCountryId
  title: string
  currency: TInstrumentId
  domain: string
}

export type TCountry = TZmCountry

// ---------------------------------------------------------------------
// COMPANY
// ---------------------------------------------------------------------

export type TCompanyId = number

export type TZmCompany = {
  id: TCompanyId
  changed: TUnixTime
  title: string
  fullTitle: string | null
  www: string
  country: TCountryId
  countryCode: string
  deleted: boolean
}

export type TCompany = Modify<TZmCompany, { changed: TMsTime }>

// ---------------------------------------------------------------------
// USER
// ---------------------------------------------------------------------

export type TUserId = number

export type TZmUser = {
  id: TUserId
  changed: TUnixTime
  currency: TInstrumentId
  parent: TUserId | null
  country: TCountryId
  countryCode: string
  email: string | null
  login: string | null
  monthStartDay: 1
  paidTill: TUnixTime
  subscription: '10yearssubscription' | '1MonthSubscription' | string
}

export type TUser = Modify<
  TZmUser,
  {
    changed: TMsTime
    paidTill: TMsTime
  }
>

// ---------------------------------------------------------------------
// ACCOUNT
// ---------------------------------------------------------------------

export type TAccountId = string

export enum accountType {
  cash = 'cash',
  ccard = 'ccard',
  checking = 'checking',
  loan = 'loan',
  deposit = 'deposit',
  emoney = 'emoney',
  debt = 'debt',
}

export type TZmAccount = {
  id: TAccountId
  changed: TUnixTime
  user: TUserId
  instrument: TInstrumentId
  title: string
  role: number | null
  company: TCompanyId | null
  type: accountType
  syncID: string[] | null
  balance: TUnits
  // Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  startBalance: TUnits
  creditLimit: TUnits
  inBalance: boolean
  savings: boolean
  enableCorrection: boolean
  enableSMS: boolean
  archive: boolean
  private: boolean
  // Для счетов с типом отличных от 'loan' и 'deposit' в  этих полях можно ставить null
  capitalization: boolean | null
  percent: number | null
  startDate: TISODate | null
  endDateOffset: number | null
  endDateOffsetInterval: 'day' | 'week' | 'month' | 'year' | null
  payoffStep: number | null
  payoffInterval: 'month' | 'year' | null
}

export interface TAccount extends TZmAccount {
  changed: TMsTime
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

export type TMerchant = Modify<
  TZmMerchant,
  {
    changed: TMsTime
  }
>

// ---------------------------------------------------------------------
// TAG
// ---------------------------------------------------------------------

export type TTagId = string

export type TZmTag = {
  id: TTagId
  changed: TUnixTime
  user: TUserId
  title: string
  parent: TTagId | null
  icon: TIconName | null
  picture: string | null
  color: number | null
  showIncome: boolean
  showOutcome: boolean
  budgetIncome: boolean
  budgetOutcome: boolean
  required: boolean | null
}

export type TTag = Modify<TZmTag, { changed: TMsTime }>

// ---------------------------------------------------------------------
// BUDGET
// ---------------------------------------------------------------------

export type TBudgetId = `${TISODate}#${TTagId}`

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

export type TBudget = Modify<
  TZmBudget,
  {
    changed: TMsTime
    // income: TMilliUnits
    // outcome: TMilliUnits
  }
> & {
  id: TBudgetId
}

// ---------------------------------------------------------------------
// REMINDER
// ---------------------------------------------------------------------

export type TReminderId = string

export interface TZmReminder {
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

export type TReminder = Modify<TZmReminder, { changed: TMsTime }>

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

export type TReminderMarker = Modify<
  TZmReminderMarker,
  {
    changed: TMsTime
    // income: TMilliUnits
    // outcome: TMilliUnits
  }
>

// ---------------------------------------------------------------------
// TRANSACTION
// ---------------------------------------------------------------------

export type TTransactionId = string

export type TZmTransaction = {
  id: TTransactionId
  changed: TUnixTime
  created: TUnixTime
  user: TUserId
  deleted: boolean
  hold: boolean | null
  viewed?: boolean
  qrCode: string | null
  incomeBankID: TCompanyId | null
  incomeInstrument: TInstrumentId
  incomeAccount: TAccountId
  income: TUnits
  outcomeBankID: TCompanyId | null
  outcomeInstrument: TInstrumentId
  outcomeAccount: TAccountId
  outcome: TUnits
  tag: TTagId[] | null
  merchant: TMerchantId | null
  payee: string | null
  originalPayee: string | null
  comment: string | null
  date: TISODate
  mcc: number | null
  reminderMarker: TReminderMarkerId | null
  opIncome: TUnits | null
  opIncomeInstrument: TInstrumentId | null
  opOutcome: TUnits | null
  opOutcomeInstrument: TInstrumentId | null
  latitude: number | null
  longitude: number | null
}

export type TTransaction = Modify<
  TZmTransaction,
  {
    changed: TMsTime
    created: TMsTime
    // income: TMilliUnits
    // outcome: TMilliUnits
    // opIncome: TMilliUnits | null
    // opOutcome: TMilliUnits | null
    // time: TMsTime
    // type: TrType
    // mainTag: TTagId | null
    // incomeBalanceBefore: TMilliUnits
    // outcomeBalanceBefore: TMilliUnits
  }
>

// ---------------------------------------------------------------------
// DELETION
// ---------------------------------------------------------------------

export type TZmDeletionObject = {
  id: string | number
  object: DataEntity
  stamp: TUnixTime
  user: TUserId
}

export type TDeletionObject = Modify<TZmDeletionObject, { stamp: TMsTime }>

// ---------------------------------------------------------------------
// DIFF
// ---------------------------------------------------------------------

export interface TZmDiff {
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

export interface TZmRequest extends TZmDiff {
  currentClientTimestamp: TUnixTime
  forceFetch?: DataEntity[]
}
