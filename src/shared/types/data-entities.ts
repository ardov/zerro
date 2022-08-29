import { TUnixTime, TUnits, TISODate, TMsTime } from './types'
import tagIcons from '@shared/tagIcons.json'

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

export interface IZmInstrument {
  id: TInstrumentId
  changed: TUnixTime
  title: string
  shortTitle: TFxCode
  symbol: string
  rate: number
}

export interface IInstrument extends IZmInstrument {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// COUNTRY
// ---------------------------------------------------------------------

export type TCountryId = number

export interface IZmCountry {
  id: TCountryId
  title: string
  currency: TInstrumentId
  domain: string
}

export interface ICountry extends IZmCountry {}

// ---------------------------------------------------------------------
// COMPANY
// ---------------------------------------------------------------------

export type TCompanyId = number

export interface IZmCompany {
  id: TCompanyId
  changed: TUnixTime
  title: string
  fullTitle: string | null
  www: string
  country: TCountryId
  countryCode: string
  deleted: boolean
}

export interface ICompany extends IZmCompany {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// USER
// ---------------------------------------------------------------------

export type TUserId = number

export interface IZmUser {
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

export interface IUser extends IZmUser {
  changed: TMsTime
  paidTill: TMsTime
}

// ---------------------------------------------------------------------
// ACCOUNT
// ---------------------------------------------------------------------

export type TAccountId = string

export enum AccountType {
  Cash = 'cash',
  Ccard = 'ccard',
  Checking = 'checking',
  Loan = 'loan',
  Deposit = 'deposit',
  Emoney = 'emoney',
  Debt = 'debt',
}

export interface IZmAccount {
  id: TAccountId
  changed: TUnixTime
  user: TUserId
  instrument: TInstrumentId
  title: string
  role: number | null
  company: TCompanyId | null
  type: AccountType
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

export interface IAccount extends IZmAccount {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// MERCHANT
// ---------------------------------------------------------------------

export type TMerchantId = string

export interface IZmMerchant {
  id: TMerchantId
  changed: TUnixTime
  user: TUserId
  title: string
}

export interface IMerchant extends IZmMerchant {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// TAG
// ---------------------------------------------------------------------

export type TTagId = string

export interface IZmTag {
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

export interface ITag extends IZmTag {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// BUDGET
// ---------------------------------------------------------------------

export type TBudgetId = `${TISODate}#${TTagId}`

export interface IZmBudget {
  changed: TUnixTime
  user: TUserId
  tag: TTagId | '00000000-0000-0000-0000-000000000000' | null
  date: TISODate
  income: TUnits
  incomeLock: boolean
  outcome: TUnits
  outcomeLock: boolean
}

export interface IBudget extends IZmBudget {
  changed: TMsTime
  // income: TMilliUnits
  // outcome: TMilliUnits

  // new
  id: TBudgetId
}

// ---------------------------------------------------------------------
// REMINDER
// ---------------------------------------------------------------------

export type TReminderId = string

export interface IZmReminder {
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

export interface IReminder extends IZmReminder {
  changed: TMsTime
}

// ---------------------------------------------------------------------
// REMINDER_MARKER
// ---------------------------------------------------------------------

export type TReminderMarkerId = string

export interface IZmReminderMarker {
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

export interface IReminderMarker extends IZmReminderMarker {
  changed: TMsTime
  // income: TMilliUnits
  // outcome: TMilliUnits
}

// ---------------------------------------------------------------------
// TRANSACTION
// ---------------------------------------------------------------------

export type TTransactionId = string

export interface IZmTransaction {
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

export interface ITransaction extends IZmTransaction {
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

// ---------------------------------------------------------------------
// DELETION
// ---------------------------------------------------------------------

export interface IZmDeletionObject {
  id: string | number
  object: DataEntity
  stamp: TUnixTime
  user: TUserId
}

export interface IDeletionObject extends IZmDeletionObject {
  stamp: TMsTime
}

// ---------------------------------------------------------------------
// DIFF
// ---------------------------------------------------------------------

export interface IZmDiff {
  serverTimestamp: TUnixTime
  deletion?: IZmDeletionObject[]
  instrument?: IZmInstrument[]
  country?: IZmCountry[]
  company?: IZmCompany[]
  user?: IZmUser[]
  merchant?: IZmMerchant[]
  account?: IZmAccount[]
  tag?: IZmTag[]
  budget?: IZmBudget[]
  reminder?: IZmReminder[]
  reminderMarker?: IZmReminderMarker[]
  transaction?: IZmTransaction[]
}

export interface IDiff {
  serverTimestamp?: TMsTime
  deletion?: IDeletionObject[]
  instrument?: IInstrument[]
  country?: ICountry[]
  company?: ICompany[]
  user?: IUser[]
  account?: IAccount[]
  merchant?: IMerchant[]
  tag?: ITag[]
  budget?: IBudget[]
  reminder?: IReminder[]
  reminderMarker?: IReminderMarker[]
  transaction?: ITransaction[]
}

export interface IZmRequest extends IZmDiff {
  currentClientTimestamp: TUnixTime
  forceFetch?: DataEntity[]
}
