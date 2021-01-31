import {
  ById,
  Account,
  Budget,
  Company,
  Country,
  Instrument,
  Merchant,
  Reminder,
  ReminderMarkerId,
  Tag,
  Transaction,
  User,
} from 'types'

type WorkerStore = {
  currentUser?: number | string
  token?: string
  syncState: 'idle' | 'pending' | 'finished'
  lastSync?: {
    finishedAt: number
    isSuccessful: boolean
    errorMessage?: string
  }
  data?: {
    serverTimestamp: number
    instrument: ById<Instrument>
    user: ById<User>
    country: ById<Country>
    company: ById<Company>
    merchant: ById<Merchant>
    reminder: ById<Reminder>
    reminderMarker: ById<ReminderMarkerId>
    account: ById<Account>
    tag: ById<Tag>
    budget: ById<Budget>
    transaction: ById<Transaction>
  }
  localChanges?: {
    merchant?: ById<Merchant>
    reminder?: ById<Reminder>
    reminderMarker?: ById<ReminderMarkerId>
    account?: ById<Account>
    tag?: ById<Tag>
    budget?: ById<Budget>
    transaction?: ById<Transaction>
  }
}

export const store: WorkerStore = { syncState: 'idle' }
