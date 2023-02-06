import { TAccountId, TFxAmount, TISODate } from '@shared/types'

export type TBalanceState<Value = TFxAmount> = {
  accounts: Record<TAccountId, Value>
  debtors: Record<string, Value>
}

export type TBalanceNode<Value = TFxAmount> = {
  date: TISODate
  balances: TBalanceState<Value>
}
