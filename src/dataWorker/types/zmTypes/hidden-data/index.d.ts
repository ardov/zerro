import { AccountId } from '../Account'
import { TISODate, TUnits } from '../common'
import { TFxCode } from '../Instrument'
import { TagId } from '../Tag'

// Account with data reminders
export const DATA_ACC_NAME = '🤖 [Zerro Data]'

// Reminder payee names
export enum DataReminderType {
  GOALS = 'goals',
  ACC_LINKS = 'accLinks',
  TAG_ORDER = 'tagOrder',
  TAG_META = 'tagMeta',
}

// GOALS
export enum goalType {
  MONTHLY = 'monthly', // monthly contribution
  MONTHLY_SPEND = 'monthlySpend', // monthly spend
  TARGET_BALANCE = 'targetBalance', //
}

export type Goal = {
  type: goalType
  amount: TUnits
  end?: TISODate
}

export type TGoalsData = {
  type: DataReminderType.GOALS
  month: TISODate
  goals: {
    [id: TagId]: Goal
  }
}

// LINKED ACCOUNTS
export type TLinkedData = {
  type: DataReminderType.ACC_LINKS
  accounts: {
    [id: AccountId]: TagId
  }
}

// TAG ORDER
export type TTagTree = {
  groupName: string
  tags: {
    id: TagId
    children?: TagId[]
  }[]
}[]

export type TTagOrderData = {
  type: DataReminderType.TAG_ORDER
  tree: TTagTree
}

// TAG META
export type TTagMetaData = {
  comment?: string
  currency?: TFxCode
}

export type TTagMeta = {
  type: DataReminderType.TAG_META
  meta: {
    [id: TagId]: TTagMetaData
  }
}
