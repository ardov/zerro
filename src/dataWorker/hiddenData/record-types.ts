import { TAccountId, TFxCode, TISODate, TTagId, TUnits } from 'types'

// GOALS
export enum goalType {
  monthly = 'monthly', // monthly contribution
  monthlySpend = 'monthlySpend', // monthly spend
  targetBalance = 'targetBalance', //
}

export enum recordType {
  goals = 'goals',
  fxRates = 'fxRates',
  budgets = 'budgets',
  linkedAccounts = 'linkedAccounts',
  linkedDebtors = 'linkedDebtors',
  tagMeta = 'tagMeta',
  tagOrder = 'tagOrder',
}

export type Goal = {
  type: goalType
  amount: TUnits
  end?: TISODate
}

// TAG META
export type TTagMetaData = {
  comment?: string
  currency?: TFxCode
}

// TAG TREE
export type TTagTree = {
  groupName: string
  tags: {
    id: TTagId
    children?: TTagId[]
  }[]
}[]

type TRecordGoals = {
  type: recordType.goals
  date: string // YYYY-MM-DD
  payload: { [tagId: TTagId]: Goal }
}
type TRecordFxRates = {
  type: recordType.fxRates
  date: string // YYYY-MM-DD
  payload: { [id: TFxCode]: number }
}
type TRecordBudgets = {
  type: recordType.budgets
  date: string // YYYY-MM-DD
  payload: { [id: TTagId]: number } // Save currency? Budgets for accounts
}
type TRecordLinkedAccounts = {
  type: recordType.linkedAccounts
  payload: { [id: TAccountId]: TTagId }
}
type TRecordLinkedDebtors = {
  type: recordType.linkedDebtors
  payload: { [id: TAccountId]: TTagId } // Only merchants?
}
type TRecordTagMeta = {
  type: recordType.tagMeta
  payload: { [id: TTagId]: TTagMetaData } // Only merchants?
}
type TRecordTagOrder = {
  type: recordType.tagOrder
  payload: TTagTree
}
export type TRecord =
  | TRecordGoals
  | TRecordFxRates
  | TRecordBudgets
  | TRecordLinkedAccounts
  | TRecordLinkedDebtors
  | TRecordTagMeta
  | TRecordTagOrder
