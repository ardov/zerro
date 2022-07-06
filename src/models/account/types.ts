import { IAccount } from 'shared/types'

export interface TAccountPopulated extends IAccount {
  convertedBalance: number
  convertedStartBalance: number
  inBudget: boolean
}
