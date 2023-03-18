import { TAccount, TFxCode, AccountType } from '@shared/types'
import { TInstCodeMap } from '@entities/currency/instrument'

export type TAccountPopulated = TAccount & {
  startBalanceReal: number
  inBudget: boolean
  fxCode: TFxCode
}

export function populate(
  raw: TAccount,
  fxIdMap: TInstCodeMap
): TAccountPopulated {
  return {
    ...raw,
    startBalanceReal: getStartBalance(raw),
    inBudget: isInBudget(raw),
    fxCode: fxIdMap[raw.instrument],
  }
}

function getStartBalance(acc: TAccount): number {
  //  Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}

function isInBudget(a: TAccount): boolean {
  if (a.type === AccountType.Debt) return false
  if (a.title.endsWith('📍')) return true
  return a.inBalance
}
