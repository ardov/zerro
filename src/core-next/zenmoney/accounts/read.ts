import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import { AccountType, type TAccount, type TAccountId } from './types'

/** Account reads must not depend on wider store slices. */
export type TAccountSource = Pick<TDataStore, 'account'>

export function getAccounts(data: TAccountSource): ById<TAccount> {
  return data.account
}

export function getDebtAccountId(data: TAccountSource): TAccountId | undefined {
  const accounts = getAccounts(data)
  for (const id in accounts) {
    if (accounts[id].type === AccountType.Debt) return id
  }
}

export function getAccountList(data: TAccountSource): TAccount[] {
  return Object.values(getAccounts(data))
}

export function getAccStartBalance(acc: TAccount): number {
  // For deposit and loan field `startBalance` means initial deposit/loan amount
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}
