import type { TISODate } from '6-shared/types'

export enum goalType {
  MONTHLY = 'monthly',
  MONTHLY_SPEND = 'monthlySpend',
  TARGET_BALANCE = 'targetBalance',
  INCOME_PERCENT = 'incomePercent',
}

export type TGoal = {
  type: goalType
  amount: number
  end?: TISODate
}
