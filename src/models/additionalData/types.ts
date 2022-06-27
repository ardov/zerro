import {
  TAccountId,
  TFxCode,
  TISODate,
  TMerchantId,
  TTagId,
  TUnits,
} from 'shared/types'

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

export type TGoal = {
  type: goalType
  amount: TUnits
  end?: TISODate
}

// TAG META
export type TTagMetaData = {
  comment?: string
  currency?: TFxCode
  carryNegatives?: boolean
  keepIncome?: boolean
}

// TAG TREE
export type TTagTree = Array<{
  groupName: string
  tags: Array<{
    id: TTagId
    children?: TTagId[]
  }>
}>

export type TBudget = {
  value: TUnits
  fx: TFxCode
}

type TRecordGoals = {
  type: recordType.goals
  date: TISODate
  payload: Record<TTagId, TGoal>
}
type TRecordFxRates = {
  type: recordType.fxRates
  date: TISODate
  payload: Record<TFxCode, number>
}
type TRecordBudgets = {
  type: recordType.budgets
  date: TISODate
  payload: {
    tags?: Record<TTagId, TBudget>
    accounts?: Record<TAccountId, TBudget>
    merchants?: Record<TMerchantId, TBudget>
  }
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
