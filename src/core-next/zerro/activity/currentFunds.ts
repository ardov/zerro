import { addFxAmount } from '6-shared/helpers/money'
import type { TFxAmount, TFxCode } from '6-shared/types'

export type TCurrentFundsAccount = {
  balance: number
  fxCode: TFxCode
}

export function buildCurrentFunds(
  accounts: TCurrentFundsAccount[]
): TFxAmount {
  return addFxAmount(
    ...accounts.map(account => ({ [account.fxCode]: account.balance }))
  )
}
