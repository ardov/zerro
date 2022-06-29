import { TAccountId } from 'models/account'
import { TFxCode } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { TTagId } from 'models/tag'
import { TISODate, TUnits } from 'shared/types'

// GOALS
export enum GoalType {
  Monthly = 'monthly', // monthly contribution
  MonthlySpend = 'monthlySpend', // monthly spend
  TargetBalance = 'targetBalance', //
}

export enum RecordType {
  Goals = 'goals',
  FxRates = 'fxRates',
  Budgets = 'budgets',
  LinkedAccounts = 'linkedAccounts',
  LinkedDebtors = 'linkedDebtors',
  TagMeta = 'tagMeta',
  TagOrder = 'tagOrder',
}

export type TGoal = {
  type: GoalType
  amount: TUnits
  end?: TISODate
}

// TAG META
export type TTagMetaData = {
  comment?: string
  currency?: TFxCode
  keepIncome?: boolean
  carryNegatives?: boolean
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
  type: RecordType.Goals
  date: TISODate
  payload: {
    tags?: Record<TTagId, TGoal>
    accounts?: Record<TAccountId, TGoal>
    merchants?: Record<TMerchantId, TGoal>
  }
}
type TRecordFxRates = {
  type: RecordType.FxRates
  date: TISODate
  payload: Record<TFxCode, number>
}
type TRecordBudgets = {
  type: RecordType.Budgets
  date: TISODate
  payload: {
    tags?: Record<TTagId, TBudget>
    accounts?: Record<TAccountId, TBudget>
    merchants?: Record<TMerchantId, TBudget>
  }
}
type TRecordLinkedAccounts = {
  type: RecordType.LinkedAccounts
  payload: { [id: TAccountId]: TTagId }
}
type TRecordLinkedDebtors = {
  type: RecordType.LinkedDebtors
  payload: { [id: TAccountId]: TTagId } // Only merchants?
}
type TRecordTagMeta = {
  type: RecordType.TagMeta
  payload: { [id: TTagId]: TTagMetaData } // Only merchants?
}
type TRecordTagOrder = {
  type: RecordType.TagOrder
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
