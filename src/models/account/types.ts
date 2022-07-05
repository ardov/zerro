import { TAccount } from 'shared/types'

export interface TAccountPopulated extends TAccount {
  convertedBalance: number
  convertedStartBalance: number
  inBudget: boolean
}
