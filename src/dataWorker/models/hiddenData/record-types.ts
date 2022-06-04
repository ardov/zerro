import {
  AccountId,
  Goal,
  TagId,
  TFxCode,
  TTagMetaData,
  TTagTree,
} from '../../types'

type TRecordGoals = {
  type: 'goals'
  date: string // YYYY-MM-DD
  payload: { [tagId: TagId]: Goal }
}
type TRecordFxRates = {
  type: 'fxRates'
  date: string // YYYY-MM-DD
  payload: { [id: TFxCode]: number }
}
type TRecordBudgets = {
  type: 'budgets'
  date: string // YYYY-MM-DD
  payload: { [id: TagId]: number } // Save currency? Budgets for accounts
}
type TRecordLinkedAccounts = {
  type: 'linkedAccounts'
  payload: { [id: AccountId]: TagId }
}
type TRecordLinkedDebtors = {
  type: 'linkedDebtors'
  payload: { [id: AccountId]: TagId } // Only merchants?
}
type TRecordTagMeta = {
  type: 'tagMeta'
  payload: { [id: TagId]: TTagMetaData } // Only merchants?
}
type TRecordTagOrder = {
  type: 'tagOrder'
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
