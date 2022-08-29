import { TISODate } from '@shared/types'

export enum goalType {
  /**
   * Monthly contribution
   * Every month I suppose to put certain amount of money into envelope
   */
  MONTHLY = 'monthly',

  /**
   * Monthly spend
   * I need certain amount of money for every month
   */
  MONTHLY_SPEND = 'monthlySpend',

  /**
   * Target envelope balance
   * 2 variants:
   * - with `end` date: I need to have certain amount of money in envelope by certain date
   * - without `end` date: I need to have certain amount of money in envelope
   */
  TARGET_BALANCE = 'targetBalance',

  /**
   * Income percent
   * I want to put certain percent of my income into envelope
   */
  INCOME_PERCENT = 'incomePercent',
}

export type TGoal = {
  type: goalType
  amount: number
  end?: TISODate
}
