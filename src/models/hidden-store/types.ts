import { TEnvelopeId } from 'models/shared/envelopeHelpers'
import {
  TAccountId,
  TFxCode,
  TISODate,
  TMerchantId,
  TTagId,
  TUnits,
} from 'shared/types'

export enum HiddenDataType {
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
  type: HiddenDataType.Goals
  date: TISODate
  payload: Record<TEnvelopeId, TGoal>
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
  type: HiddenDataType.TagMeta
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
  type: HiddenDataType.TagOrder
  payload: TTagTree
}

// —————————————————————————————————————————————————————————————————————————————
// BUDGETS
// —————————————————————————————————————————————————————————————————————————————

export type TBudget = {
  value: TUnits
  fx: TFxCode
}

export type TRecordBudgets = {
  type: HiddenDataType.Budgets
  date: TISODate
  payload: Record<TEnvelopeId, TBudget>
}

// —————————————————————————————————————————————————————————————————————————————
// LINKED ACCOUNTS
// —————————————————————————————————————————————————————————————————————————————

export type TRecordLinkedAccounts = {
  type: HiddenDataType.LinkedAccounts
  payload: Record<TAccountId, TTagId>
}

// —————————————————————————————————————————————————————————————————————————————
// LINKED MERCHANTS
// —————————————————————————————————————————————————————————————————————————————

export type TRecordLinkedMerchants = {
  type: HiddenDataType.LinkedDebtors
  payload: Record<TMerchantId, TTagId>
}

// —————————————————————————————————————————————————————————————————————————————
// RECORD
// —————————————————————————————————————————————————————————————————————————————
