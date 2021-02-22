import { createSelector } from '@reduxjs/toolkit'
import { sortBy } from 'store/localData/transactions/helpers'
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

export type WorkerStore = {
  currentUser?: number | string
  token?: string
  syncState: 'idle' | 'pending' | 'finished'
  lastSync?: {
    finishedAt: number
    isSuccessful: boolean
    errorMessage?: string
  }
  serverData: {
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
    account?: ById<Account>
    merchant?: ById<Merchant>
    tag?: ById<Tag>
    budget?: ById<Budget>
    reminder?: ById<Reminder>
    reminderMarker?: ById<ReminderMarkerId>
    transaction?: ById<Transaction>
  }
}

export const store: WorkerStore = {
  syncState: 'idle',
  serverData: {
    serverTimestamp: 0,
    instrument: {},
    user: {},
    country: {},
    company: {},
    merchant: {},
    reminder: {},
    reminderMarker: {},
    account: {},
    tag: {},
    budget: {},
    transaction: {},
  },
}

const getServerTransactions = (state: WorkerStore) =>
  state.serverData.transaction
const getLocalTransactions = (state: WorkerStore) =>
  state.localChanges?.transaction || {}
const getTransactions = createSelector(
  [getServerTransactions, getLocalTransactions],
  (transactions, diff) => ({ ...transactions, ...diff })
)
export const getSortedTransactions = createSelector(
  [getTransactions],
  transactions => Object.values(transactions).sort(sortBy('DATE'))
)
