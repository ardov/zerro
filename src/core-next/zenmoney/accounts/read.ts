import type { ById, TDataStore } from '6-shared/types'
import { ZERRO_DATA_ACCOUNT_NAME } from '../../constants'
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

export function getSavingAccounts(data: TDataStore): TAccount[] {
  return getAccountList(data).filter(
    account =>
      !isAccInBudget(account) &&
      account.type !== AccountType.Debt &&
      account.title !== ZERRO_DATA_ACCOUNT_NAME
  )
}

export function getInBudgetAccountIds(data: TDataStore): TAccountId[] {
  return getAccountList(data)
    .filter(isAccInBudget)
    .map(account => account.id)
}

export function getAccStartBalance(acc: TAccount): number {
  // For deposit and loan field `startBalance` means initial deposit/loan amount
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}

export function isAccInBudget(account: TAccount): boolean {
  if (account.type === AccountType.Debt) return false
  if (account.title.endsWith('📍')) return true
  return account.inBalance
}
