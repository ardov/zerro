import { AccountType, TAccount } from '@shared/types'

export function getStartBalance(acc: TAccount): number {
  //  Для deposit и loan поле startBalance имеет смысл начального взноса/тела кредита
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}

export function isInBudget(a: TAccount): boolean {
  if (a.type === AccountType.Debt) return false
  if (a.title.endsWith('📍')) return true
  return a.inBalance
}
