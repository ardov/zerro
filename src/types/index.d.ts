export type Modify<T, R> = Omit<T, keyof R> & R

export type Token = string | null

export type UserId = number
export type InstrumentId = number
export type CompanyId = number
export type CountryId = number
export type TagId = string | null
export type MerchantId = string
export type ReminderId = string
export type ReminderMarkerId = string
export type TransactionId = string
export type AccountId = string

export type TransactionType = 'transfer' | 'income' | 'outcome'
export type GoalType = 'monthly' | 'monthlySpend' | 'targetBalance'
export type ObjectClass =
  | 'instrument'
  | 'company'
  | 'user'
  | 'account'
  | 'tag'
  | 'merchant'
  | 'budget'
  | 'reminder'
  | 'reminderMarker'
  | 'transaction'

export interface Instrument {
  id: InstrumentId
  changed: number // Unix timestamp
  title: string
  shortTitle: string
  symbol: string
  rate: number
}

export interface Company {
  id: CompanyId
  changed: number // Unix timestamp
  title: string
  fullTitle: string
  www: string
  country: CountryId
}

export interface Country {
  id: CountryId
  title: string
  currency: InstrumentId
  domain: string
}

export interface User {
  id: UserId
  changed: number // Unix timestamp
  login: string | null
  currency: InstrumentId
  parent: UserId | null
}

export interface Account {
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
  capitalization?: boolean | null
  percent?: number | null
  startDate?: number | null
  endDateOffset?: number | null
  endDateOffsetInterval?: 'day' | 'week' | 'month' | 'year' | null
  payoffStep?: number | null
  payoffInterval?: 'month' | 'year' | null
}

export interface Tag {
  id: TagId // UUID
  changed: number // Unix timestamp
  user: UserId

  title: string
  parent: TagId | null
  icon: string | null
  picture: string | null
  color: number | null

  showIncome: boolean
  showOutcome: boolean
  budgetIncome: boolean
  budgetOutcome: boolean
  required: boolean | null
}

export interface PopulatedTag extends Tag {
  name: string
  symbol: string
  colorRGB: string | null
  colorGenerated: string
}

export interface Merchant {
  id: MerchantId // UUID
  changed: number // Unix timestamp
  user: UserId
  title: string
}

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
  extends Modify<
    ZmReminder,
    {
      startDate: number
      endDate: number
    }
  > {}

export interface Transaction {
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

  date: number

  mcc: number | null

  reminderMarker: ReminderMarkerId | null

  opIncome: number | null
  opIncomeInstrument: InstrumentId | null
  opOutcome: number | null
  opOutcomeInstrument: InstrumentId | null

  latitude: number | null
  longitude: number | null
}
export interface ZmTransaction extends Modify<Transaction, { date: string }> {}

export interface Budget {
  changed: number
  user: UserId

  tag: TagId | '00000000-0000-0000-0000-000000000000' | null
  date: number

  income: number
  incomeLock: boolean
  outcome: number
  outcomeLock: boolean
}
export interface ZmBudget extends Modify<Budget, { date: string }> {}

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
export interface ZmDiffObject {
  currentClientTimestamp: number //Unix timestamp
  serverTimestamp: number //Unix timestamp

  forceFetch?: ObjectClass[]

  instrument?: Instrument[]
  company?: Company[]
  user?: User[]
  account?: Account[]
  tag?: Tag[]
  merchant?: Merchant[]
  budget?: Budget[]
  reminder?: Reminder[]
  reminderMarker?: ReminderMarker[]
  transaction?: Transaction[]

  deletion?: ZmDeletionObject[]
}
