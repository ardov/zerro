import { Modify, ById } from './ts-utils'
import { RootState } from 'store'
import { goalType } from 'store/data/hiddenData/constants'
import iconsMap from 'store/data/tags/iconsMap.json'
type IconsMap = typeof iconsMap

export type TUnixTime = number
export type TMsTime = number
export type TISODate = string // 2000-01-01
export type TISOTimestamp = string // 2000-01-01T00:00:00.000Z

export type TUnits = number
export type TMilliUnits = number

export type Selector<T> = (state: RootState) => T

export type Token = string | null

export type TCompanyId = number
export type TUserId = number
export type TAccountId = string
export type TMerchantId = string
export type TTagId = string
export type TReminderId = string
export type TReminderMarkerId = string
export type TTransactionId = string

export type TTransactionType =
  | 'income'
  | 'outcome'
  | 'transfer'
  | 'incomeDebt'
  | 'outcomeDebt'

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

export type TInstrument = Modify<
  TZmInstrument,
  {
    changed: TMsTime
  }
>

export type TFxIdMap = {
  [id: TInstrumentId]: TFxCode
}

// ---------------------------------------------------------------------
// COUNTRY
// ---------------------------------------------------------------------

export type TCountryId = number

export type ZmCountry = {
  id: TCountryId
  title: string
  currency: TInstrumentId
  domain: string
}

export type Country = ZmCountry

export type ZmCompany = {
  id: TCompanyId
  changed: TUnixTime
  title: string
  fullTitle: string | null
  www: string
  country: TCountryId
  countryCode: string
  deleted: boolean
}
export type Company = ZmCompany

export type ZmUser = {
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
export type User = ZmUser

export type ZmAccount = {
  user: TUserId
  instrument: TInstrumentId
  title: string
  id: TAccountId
  changed: number
  role: number | null
  company: TCompanyId | null
  type: 'cash' | 'ccard' | 'checking' | 'loan' | 'deposit' | 'emoney' | 'debt'
  syncID: string[] | null
  balance: number
  // Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  startBalance: number
  creditLimit: number
  inBalance: boolean
  savings: boolean
  enableCorrection: boolean
  enableSMS: boolean
  archive: boolean
  private: boolean
  // Для счетов с типом отличных от 'loan' и 'deposit' в  этих полях можно ставить null
  capitalization: boolean | null
  percent: number | null
  startDate: string | null
  endDateOffset: number | null
  endDateOffsetInterval: 'day' | 'week' | 'month' | 'year' | null
  payoffStep: number | null
  payoffInterval: 'month' | 'year' | null
}
export type Account = Modify<ZmAccount, { startDate: number | null }>
export interface PopulatedAccount extends Account {
  convertedBalance: number
  convertedStartBalance: number
  inBudget: boolean
}

export type ZmMerchant = {
  id: TMerchantId // UUID
  changed: TUnixTime
  user: TUserId
  title: string
}
export type Merchant = ZmMerchant

export type ZmTag = {
  id: TTagId // UUID
  changed: TUnixTime
  user: TUserId
  title: string
  parent: TTagId | null
  icon: keyof IconsMap | null
  picture: string | null
  color: number | null
  showIncome: boolean
  showOutcome: boolean
  budgetIncome: boolean
  budgetOutcome: boolean
  required: boolean | null
}
export type Tag = ZmTag
export type PopulatedTag = Tag &
  TagMeta & {
    name: string
    uniqueName: string
    symbol: string
    children: string[]
    colorRGB: string | null
    colorHEX: string | null
    colorGenerated: string
  }

export type TagMeta = {
  comment?: string
  currency?: TInstrumentId
}

export interface ZmBudget {
  changed: number
  user: TUserId
  tag: TTagId | '00000000-0000-0000-0000-000000000000' | null
  date: string
  income: number
  incomeLock: boolean
  outcome: number
  outcomeLock: boolean
}
export interface Budget extends Modify<ZmBudget, { date: number }> {}
export interface PopulatedBudget extends Budget {
  convertedOutcome: number
  instrument: TInstrumentId | null
}

export interface ZmReminder {
  id: TReminderId
  changed: number
  user: TUserId
  incomeInstrument: TInstrumentId
  incomeAccount: string
  income: number
  outcomeInstrument: TInstrumentId
  outcomeAccount: string
  outcome: number
  tag: string[] | null
  merchant: TMerchantId | null
  payee: string | null
  comment: string | null
  interval: 'day' | 'week' | 'month' | 'year' | null
  step: number | null
  points: number[] | null
  startDate: string
  endDate: string
  notify: boolean
}
export interface Reminder
  extends Modify<ZmReminder, { startDate: number; endDate: number }> {}

export type ZmReminderMarker = {
  id: string // UUID
  changed: TUnixTime
  user: TUserId
  incomeInstrument: TInstrumentId
  incomeAccount: TAccountId
  income: number
  outcomeInstrument: TInstrumentId
  outcomeAccount: TAccountId
  outcome: number
  tag: TTagId[] | null
  merchant: TMerchantId | null
  payee: string | null
  comment: string | null
  date: string // 'yyyy-MM-dd'
  reminder: TReminderId
  state: 'planned' | 'processed' | 'deleted'
  notify: boolean
}
export type ReminderMarker = Modify<ZmReminderMarker, { date: number }>

export interface ZmTransaction {
  id: TTransactionId // UUID
  changed: number
  created: number
  user: TUserId
  deleted: boolean
  hold: boolean | null
  viewed?: boolean
  qrCode: string | null
  incomeBankID: TCompanyId | null
  incomeInstrument: TInstrumentId
  incomeAccount: TAccountId
  income: number
  outcomeBankID: TCompanyId | null
  outcomeInstrument: TInstrumentId
  outcomeAccount: TAccountId
  outcome: number
  tag: TTagId[] | null
  merchant: TMerchantId | null
  payee: string | null
  originalPayee: string | null
  comment: string | null
  date: string
  mcc: number | null
  reminderMarker: TReminderMarkerId | null
  opIncome: number | null
  opIncomeInstrument: TInstrumentId | null
  opOutcome: number | null
  opOutcomeInstrument: TInstrumentId | null
  latitude: number | null
  longitude: number | null
}
export interface Transaction extends Modify<ZmTransaction, { date: number }> {}

export interface Goal {
  type: goalType
  amount: number
  end?: number
}
export interface ZmGoal extends Modify<Goal, { end?: string }> {}

export interface ZmDeletionObject {
  id: string | number
  object: TObjectClass
  stamp: number
  user: number
}
export type DeletionObject = ZmDeletionObject

export interface ZmDiff {
  serverTimestamp: TUnixTime
  deletion?: ZmDeletionObject[]
  instrument?: TZmInstrument[]
  country?: ZmCountry[]
  company?: ZmCompany[]
  user?: ZmUser[]
  account?: ZmAccount[]
  merchant?: ZmMerchant[]
  tag?: ZmTag[]
  budget?: ZmBudget[]
  reminder?: ZmReminder[]
  reminderMarker?: ZmReminderMarker[]
  transaction?: ZmTransaction[]
}
export interface Diff {
  serverTimestamp?: number
  deletion?: DeletionObject[]
  instrument?: TInstrument[]
  country?: Country[]
  company?: Company[]
  user?: User[]
  account?: Account[]
  merchant?: Merchant[]
  tag?: Tag[]
  budget?: Budget[]
  reminder?: Reminder[]
  reminderMarker?: ReminderMarker[]
  transaction?: Transaction[]
}

export type ZmRequest = ZmDiff & {
  currentClientTimestamp: TUnixTime
  forceFetch?: TObjectClass[]
}
export type LocalData = Omit<ZmDiff, 'deletion'>

export type DataStore = {
  serverTimestamp: number
  instrument: ById<TInstrument>
  country: ById<Country>
  company: ById<Company>
  user: ById<User>
  account: ById<Account>
  merchant: ById<Merchant>
  tag: ById<Tag>
  budget: ById<Budget>
  reminder: ById<Reminder>
  reminderMarker: ById<TReminderMarkerId>
  transaction: ById<Transaction>
}
export type DataStorePatch = Partial<DataStore> & {
  deletion?: ZmDeletionObject[]
}
