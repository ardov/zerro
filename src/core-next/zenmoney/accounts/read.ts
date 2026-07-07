import type { ById, TDataStore } from '6-shared/types'
import { AccountType, type TAccount, type TAccountId } from './types'

export function getAccounts(data: TDataStore): ById<TAccount> {
  return data.account
}

export function getDebtAccountId(data: TDataStore): TAccountId | undefined {
  const accounts = getAccounts(data)
  for (const id in accounts) {
    if (accounts[id].type === AccountType.Debt) return id
  }
}

export function getAccountList(data: TDataStore): TAccount[] {
  return Object.values(getAccounts(data))
}

export function getAccStartBalance(acc: TAccount): number {
  // For deposit and loan field `startBalance` means initial deposit/loan amount
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}
