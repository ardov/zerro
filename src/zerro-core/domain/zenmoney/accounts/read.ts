import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import { AccountType, type TAccount, type TAccountId } from './types'
import type { TFxCode, TInstrumentId } from '../instruments'

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

export type TAccountPopulated = TAccount & {
  startBalanceReal: number
  inBudget: boolean
  fxCode: TFxCode
}

/** UI-friendly account projection. Currency metadata stays an explicit input. */
export function populateAccount(
  account: TAccount,
  instrumentCodeById: Record<TInstrumentId, TFxCode>
): TAccountPopulated {
  return {
    ...account,
    startBalanceReal: getAccStartBalance(account),
    inBudget: isInBudgetAccount(account),
    fxCode: instrumentCodeById[account.instrument],
  }
}

export function getPopulatedAccounts(
  data: TAccountSource,
  instrumentCodeById: Record<TInstrumentId, TFxCode>
): ById<TAccountPopulated> {
  return Object.fromEntries(
    Object.entries(getAccounts(data)).map(([id, account]) => [
      id,
      populateAccount(account, instrumentCodeById),
    ])
  )
}

export function isInBudgetAccount(account: TAccount): boolean {
  if (account.type === AccountType.Debt) return false
  if (account.title.endsWith('📍')) return true
  return account.inBalance
}

export function getAccStartBalance(acc: TAccount): number {
  // For deposit and loan field `startBalance` means initial deposit/loan amount
  if (acc.type === AccountType.Deposit) return 0
  if (acc.type === AccountType.Loan) return 0
  return acc.startBalance
}
