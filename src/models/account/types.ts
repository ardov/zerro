import { IAccount } from 'shared/types'

export interface IAccountPopulated extends IAccount {
  convertedBalance: number
  convertedStartBalance: number
  inBudget: boolean
}
