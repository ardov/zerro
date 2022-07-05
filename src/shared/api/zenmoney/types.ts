import { TUnixTime, TUnits, TISODate } from 'shared/types'

export type TAccessToken = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

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
  icon: string | null
  picture: string | null
  color: number | null
  showIncome: boolean
  showOutcome: boolean
  budgetIncome: boolean
  budgetOutcome: boolean
  required: boolean | null
}

// ---------------------------------------------------------------------
// BUDGET
// ---------------------------------------------------------------------

// export type TBudgetId = `${TISODate}#${TTagId}`

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

// ---------------------------------------------------------------------
// TRANSACTION
// ---------------------------------------------------------------------

export type TTransactionId = string

// export enum TrType {
//   Income = 'income',
//   Outcome = 'outcome',
//   Transfer = 'transfer',
//   IncomeDebt = 'incomeDebt',
//   OutcomeDebt = 'outcomeDebt',
// }

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

// ---------------------------------------------------------------------
// DELETION
// ---------------------------------------------------------------------

export type TZmDeletionObject = {
  id: string | number
  object: DataEntity
  stamp: TUnixTime
  user: TUserId
}

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

export interface TZmRequest extends TZmDiff {
  currentClientTimestamp: TUnixTime
  forceFetch?: DataEntity[]
}
