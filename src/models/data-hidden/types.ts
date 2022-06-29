import { TAccountId } from 'models/account'
import { EntityType } from 'models/deletion'
import { TFxCode } from 'models/instrument'
import { TMerchantId } from 'models/merchant'
import { TTagId } from 'models/tag'
import { TISODate, TUnits } from 'shared/types'

export enum RecordType {
  Goals = 'goals',
  FxRates = 'fxRates',
  Budgets = 'budgets',
  LinkedAccounts = 'linkedAccounts',
  LinkedDebtors = 'linkedDebtors',
  TagMeta = 'tagMeta',
  TagOrder = 'tagOrder',
}

// —————————————————————————————————————————————————————————————————————————————
// GOALS
// —————————————————————————————————————————————————————————————————————————————

export enum GoalType {
  Monthly = 'monthly', // monthly contribution
  MonthlySpend = 'monthlySpend', // monthly spend
  TargetBalance = 'targetBalance', //
}

export type TGoal = {
  type: GoalType
  amount: TUnits
  end?: TISODate
}

export type TRecordGoals = {
  type: RecordType.Goals
  date: TISODate
  payload: {
    [EntityType.Tag]?: Record<TTagId, TGoal>
    [EntityType.Account]?: Record<TAccountId, TGoal>
    [EntityType.Merchant]?: Record<TMerchantId, TGoal>
  }
}

// —————————————————————————————————————————————————————————————————————————————
// TAG META
// —————————————————————————————————————————————————————————————————————————————

export type TTagMetaData = {
  comment?: string
  currency?: TFxCode
  keepIncome?: boolean
  carryNegatives?: boolean
}

export type TRecordTagMeta = {
  type: RecordType.TagMeta
  payload: { [id: TTagId]: TTagMetaData } // Only merchants?
}

// —————————————————————————————————————————————————————————————————————————————
// TAG TREE
// —————————————————————————————————————————————————————————————————————————————

export type TTagTree = Array<{
  groupName: string
  tags: Array<{
    id: TTagId
    children?: TTagId[]
  }>
}>

export type TRecordTagOrder = {
  type: RecordType.TagOrder
  payload: TTagTree
}

// —————————————————————————————————————————————————————————————————————————————
// FX RATES
// —————————————————————————————————————————————————————————————————————————————

export type TRecordFxRates = {
  type: RecordType.FxRates
  date: TISODate
  payload: Record<TFxCode, number>
}

// —————————————————————————————————————————————————————————————————————————————
// BUDGETS
// —————————————————————————————————————————————————————————————————————————————

export type TBudget = {
  value: TUnits
  fx: TFxCode
}

export type TRecordBudgets = {
  type: RecordType.Budgets
  date: TISODate
  payload: {
    [EntityType.Tag]?: Record<TTagId, TBudget>
    [EntityType.Account]?: Record<TAccountId, TBudget>
    [EntityType.Merchant]?: Record<TMerchantId, TBudget>
  }
}

// —————————————————————————————————————————————————————————————————————————————
// LINKED ACCOUNTS
// —————————————————————————————————————————————————————————————————————————————

export type TRecordLinkedAccounts = {
  type: RecordType.LinkedAccounts
  payload: Record<TAccountId, TTagId>
}

// —————————————————————————————————————————————————————————————————————————————
// LINKED MERCHANTS
// —————————————————————————————————————————————————————————————————————————————

export type TRecordLinkedMerchants = {
  type: RecordType.LinkedDebtors
  payload: Record<TMerchantId, TTagId>
}

// —————————————————————————————————————————————————————————————————————————————
// RECORD
// —————————————————————————————————————————————————————————————————————————————

export type TRecord =
  | TRecordGoals
  | TRecordFxRates
  | TRecordBudgets
  | TRecordLinkedAccounts
  | TRecordLinkedMerchants
  | TRecordTagMeta
  | TRecordTagOrder
