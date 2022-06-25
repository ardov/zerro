import { Modify, ById } from './ts-utils'
import { RootState } from 'models'
import { goalType } from 'models/data/hiddenData/constants'
import iconsMap from 'models/data/tags/iconsMap.json'

export type TUnixTime = number
export type TMsTime = number
export type TISODate = string // 2000-01-01
export type TISOTimestamp = string // 2000-01-01T00:00:00.000Z

export type TUnits = number
export type TMilliUnits = number

export type TSelector<T> = (state: RootState) => T

export type TToken = string | null

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

export type TFxIdMap = {
  [id: TInstrumentId]: TFxCode
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

export type TRawCountry = TZmCountry

// export type TCountry = TZmCountry & { fxCode: TFxCode }

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

export type TRawUser = Modify<TZmUser, { changed: TMsTime; paidTill: TMsTime }>

export type TUser = TRawUser & { fxCode: TFxCode }

// ---------------------------------------------------------------------
// ACCOUNT
// ---------------------------------------------------------------------

export type TAccountId = string

export type TZmAccount = {
  id: TAccountId
  changed: TUnixTime
  user: TUserId
  instrument: TInstrumentId
  title: string
  role: number | null
  company: TCompanyId | null
  type: 'cash' | 'ccard' | 'checking' | 'loan' | 'deposit' | 'emoney' | 'debt'
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

export type TRawAccount = Modify<
  TZmAccount,
  {
    changed: TMsTime
    startDate: TMsTime | null
    balance: TMilliUnits
    startBalance: TMilliUnits
    creditLimit: TMilliUnits
  }
>

export type TPopulatedAccount = TRawAccount & {
  convertedBalance: number
  convertedStartBalance: number
  inBudget: boolean
}

export type TAccount = TRawAccount & {
  inBudget: boolean
  fxCode: TFxCode
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

export type TMerchant = Modify<TZmMerchant, { changed: TMsTime }>

// ---------------------------------------------------------------------
// TAG
// ---------------------------------------------------------------------

export type TTagId = string
type TIconName = keyof typeof iconsMap

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

export type TRawTag = Modify<TZmTag, { changed: TMsTime }>

export type TTag = TRawTag & {
  name: string // Tag name without emoji
  uniqueName: string // If name not unique adds parent name
  symbol: string // Emoji
  children: string[]
  colorRGB: string | null
  colorHEX: string | null
  colorGenerated: string // Color generated from name
  // From hidden data
  comment?: string | null
  currencyCode?: TFxCode | null
  group?: string | null
}

// ---------------------------------------------------------------------
// BUDGET
// ---------------------------------------------------------------------

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
    date: TMsTime
    income: TMilliUnits
    outcome: TMilliUnits
  }
>

export type PopulatedBudget = TBudget & {
  convertedOutcome: number
  instrument: TInstrumentId | null
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

export type TRawReminder = Modify<
  TZmReminder,
  {
    changed: TMsTime
    startDate: TMsTime
    endDate: TMsTime
  }
>

export type TReminder = TRawReminder & {
  incomeFxCode: TFxCode
  outcomeFxCode: TFxCode
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
export type TRawReminderMarker = Modify<
  TZmReminderMarker,
  {
    changed: TMsTime
    date: TMsTime
    income: TMilliUnits
    outcome: TMilliUnits
  }
>

export type TReminderMarker = TRawReminderMarker & {
  incomeFxCode: TFxCode
  outcomeFxCode: TFxCode
}

// ---------------------------------------------------------------------
// TRANSACTION
// ---------------------------------------------------------------------

export type TTransactionId = string

export enum TrType {
  income = 'income',
  outcome = 'outcome',
  transfer = 'transfer',
  incomeDebt = 'incomeDebt',
  outcomeDebt = 'outcomeDebt',
}

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

export type TRawTransaction = Modify<
  TZmTransaction,
  {
    changed: TMsTime
    created: TMsTime
    date: TMsTime
    income: TMilliUnits
    outcome: TMilliUnits
    opIncome: TMilliUnits | null
    opOutcome: TMilliUnits | null
  }
>

export type TTransaction = TRawTransaction & {
  incomeFxCode: TFxCode
  outcomeFxCode: TFxCode
  opIncomeFxCode: TFxCode | null
  opOutcomeFxCode: TFxCode | null
  time: TMsTime
  type: TrType
  mainTag: TTagId | null
  incomeBalanceBefore: TMilliUnits
  outcomeBalanceBefore: TMilliUnits
}

// ---------------------------------------------------------------------
// DELETION
// ---------------------------------------------------------------------

export type TZmDeletionObject = {
  id: string | number
  object: TObjectClass
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
  account?: TZmAccount[]
  merchant?: TZmMerchant[]
  tag?: TZmTag[]
  budget?: TZmBudget[]
  reminder?: TZmReminder[]
  reminderMarker?: TZmReminderMarker[]
  transaction?: TZmTransaction[]
}

export interface TDiff {
  serverTimestamp?: number
  deletion?: TDeletionObject[]
  instrument?: TInstrument[]
  country?: TRawCountry[]
  company?: TCompany[]
  user?: TRawUser[]
  account?: TRawAccount[]
  merchant?: TMerchant[]
  tag?: TRawTag[]
  budget?: TBudget[]
  reminder?: TRawReminder[]
  reminderMarker?: TRawReminderMarker[]
  transaction?: TRawTransaction[]
}

export type TZmRequest = TZmDiff & {
  currentClientTimestamp: TUnixTime
  forceFetch?: TObjectClass[]
}

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
  end?: number
}

export type TZmGoal = Modify<TGoal, { end?: string }>

export type TLocalData = Omit<TZmDiff, 'deletion'>

export type TDataStore = {
  serverTimestamp: number
  instrument: ById<TInstrument>
  country: ById<TRawCountry>
  company: ById<TCompany>
  user: ById<TRawUser>
  account: ById<TRawAccount>
  merchant: ById<TMerchant>
  tag: ById<TRawTag>
  budget: ById<TBudget>
  reminder: ById<TRawReminder>
  reminderMarker: ById<TRawReminderMarker>
  transaction: ById<TRawTransaction>
}
export type TDataStorePatch = Partial<TDataStore> & {
  deletion?: TZmDeletionObject[]
}
