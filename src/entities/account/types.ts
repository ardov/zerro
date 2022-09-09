import { TAccount, TFxCode } from '@shared/types'

export interface IAccountPopulated extends TAccount {
  convertedBalance: number
  convertedStartBalance: number
  inBudget: boolean
  fxCode: TFxCode
}
