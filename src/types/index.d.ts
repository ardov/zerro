import iconsMap from 'store/localData/tags/iconsMap.json'
type IconsMap = typeof iconsMap

export type ById<T> = { [id: string]: T }
export type Modify<T, R> = Omit<T, keyof R> & R
export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>

export type Token = string | null

export type InstrumentId = number
export type CountryId = number
export type CompanyId = number
export type UserId = number
export type AccountId = string
export type MerchantId = string
export type TagId = string
export type ReminderId = string
export type ReminderMarkerId = string
export type TransactionId = string

export type TransactionType =
  | 'income'
  | 'outcome'
  | 'transfer'
  | 'incomeDebt'
  | 'outcomeDebt'
export type GoalType = 'monthly' | 'monthlySpend' | 'targetBalance'
export type ObjectClass =
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

export type ZmInstrument = {
  id: InstrumentId
  changed: number // Unix timestamp
  title: string
  shortTitle: string
  symbol: string
  rate: number
}
export type Instrument = ZmInstrument

export type ZmCountry = {
  id: CountryId
  title: string
  currency: InstrumentId
  domain: string
}
export type Country = ZmCountry

export type ZmCompany = {
  id: CompanyId
  changed: number // Unix timestamp
  title: string
  fullTitle: string | null
  www: string
  country: CountryId
  countryCode: string
  deleted: boolean
}
export type Company = ZmCompany

export type ZmUser = {
  id: UserId
  changed: number // Unix timestamp
  currency: InstrumentId
  parent: UserId | null
  country: CountryId
  countryCode: string
  email: string | null
  login: string | null
  monthStartDay: 1
  paidTill: number // Unix timestamp
  subscription: '10yearssubscription' | '1MonthSubscription' | string
}
export type User = ZmUser

export type ZmAccount = {
  user: UserId
  instrument: InstrumentId
  title: string
  id: AccountId
  changed: number
  role: number | null
  company: CompanyId | null
  type: 'cash' | 'ccard' | 'checking' | 'loan' | 'deposit' | 'emoney' | 'debt'
  syncID: string[] | null
  balance: number
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
  id: MerchantId // UUID
  changed: number // Unix timestamp
  user: UserId
  title: string
}
export type Merchant = ZmMerchant

export type ZmTag = {
  id: TagId // UUID
  changed: number // Unix timestamp
  user: UserId
  title: string
  parent: TagId | null
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
export interface PopulatedTag extends Tag {
  name: string
  symbol: string
  children: string[]
  colorRGB: string | null
  colorHEX: string | null
  colorGenerated: string
}

export interface ZmBudget {
  changed: number
  user: UserId
  tag: TagId | '00000000-0000-0000-0000-000000000000' | null
  date: string
  income: number
  incomeLock: boolean
  outcome: number
  outcomeLock: boolean
}
export interface Budget extends Modify<ZmBudget, { date: number }> {}

export interface ZmReminder {
  id: ReminderId
  changed: number
  user: UserId
  incomeInstrument: InstrumentId
  incomeAccount: string
  income: number
  outcomeInstrument: InstrumentId
  outcomeAccount: string
  outcome: number
  tag: string[] | null
  merchant: MerchantId | null
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
  changed: number // Unix timestamp
  user: UserId
  incomeInstrument: InstrumentId
  incomeAccount: AccountId
  income: number
  outcomeInstrument: InstrumentId
  outcomeAccount: AccountId
  outcome: number
  tag: TagId[] | null
  merchant: MerchantId | null
  payee: string | null
  comment: string | null
  date: string // 'yyyy-MM-dd'
  reminder: ReminderId
  state: 'planned' | 'processed' | 'deleted'
  notify: boolean
}
export type ReminderMarker = Modify<ZmReminderMarker, { date: number }>

export interface ZmTransaction {
  id: TransactionId // UUID
  changed: number
  created: number
  user: UserId
  deleted: boolean
  hold: boolean | null
  viewed?: boolean
  qrCode: string | null
  incomeBankID: CompanyId | null
  incomeInstrument: InstrumentId
  incomeAccount: AccountId
  income: number
  outcomeBankID: CompanyId | null
  outcomeInstrument: InstrumentId
  outcomeAccount: AccountId
  outcome: number
  tag: TagId[] | null
  merchant: MerchantId | null
  payee: string | null
  originalPayee: string | null
  comment: string | null
  date: string
  mcc: number | null
  reminderMarker: ReminderMarkerId | null
  opIncome: number | null
  opIncomeInstrument: InstrumentId | null
  opOutcome: number | null
  opOutcomeInstrument: InstrumentId | null
  latitude: number | null
  longitude: number | null
}
export interface Transaction extends Modify<ZmTransaction, { date: number }> {}

export interface Goal {
  type: GoalType
  amount: number
  end?: number
}
export interface ZmGoal extends Modify<Goal, { end?: string }> {}

export interface ZmDeletionObject {
  id: string | number
  object: ObjectClass
  stamp: number
  user: number
}
export interface ZmDiff {
  serverTimestamp: number // Unix timestamp
  deletion?: ZmDeletionObject[]
  instrument?: ZmInstrument[]
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

export type ZmRequest = ZmDiff & {
  currentClientTimestamp: number // Unix timestamp
  forceFetch?: ObjectClass[]
}
export type LocalData = Omit<ZmDiff, 'deletion'>

export type DataStore = {
  serverTimestamp: number
  instrument: ById<Instrument>
  country: ById<Country>
  company: ById<Company>
  user: ById<User>
  account: ById<Account>
  merchant: ById<Merchant>
  tag: ById<Tag>
  budget: ById<Budget>
  reminder: ById<Reminder>
  reminderMarker: ById<ReminderMarkerId>
  transaction: ById<Transaction>
}
export type DataStorePatch = Partial<DataStore> & {
  deletion?: ZmDeletionObject[]
}
