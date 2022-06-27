import { accountType, TRawAccount } from 'shared/types'

export function getStartBalance(acc: TRawAccount): number {
  //  Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  if (acc.type === accountType.deposit) return 0
  if (acc.type === accountType.loan) return 0
  return acc.startBalance
}

export function isInBudget(a: TRawAccount): boolean {
  if (a.type === accountType.debt) return false
  if (a.title.endsWith('📍')) return true
  return a.inBalance
}
