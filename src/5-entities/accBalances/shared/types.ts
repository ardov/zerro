import { TAccountId, TFxAmount, TISODate } from '6-shared/types'

export type TBalanceState<Value = TFxAmount> = {
  accounts: Record<TAccountId, Value>
  debtors: Record<string, Value>
}

export type TBalanceNode<Value = TFxAmount> = {
  date: TISODate
  balances: TBalanceState<Value>
}
