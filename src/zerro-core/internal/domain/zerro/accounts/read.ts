import { ZERRO_DATA_ACCOUNT_NAME } from '../../../../constants'
import {
  AccountType,
  getAccStartBalance,
  getAccountList,
  type TAccount,
  type TAccountId,
} from '../../zenmoney/entities/accounts'
import type {
  TFxCode,
  TInstrumentId,
} from '../../zenmoney/entities/instruments'
import type { ById } from '../../foundation/types'

export type TAccountPopulated = TAccount & {
  startBalanceReal: number
  inBudget: boolean
  fxCode: TFxCode
}

export function getPopulatedAccounts(
  accounts: ById<TAccount>,
  instrumentCodeById: Record<TInstrumentId, TFxCode>
): ById<TAccountPopulated> {
  return Object.fromEntries(
    Object.entries(accounts).map(([id, account]) => [
      id,
      {
        ...account,
        startBalanceReal: getAccStartBalance(account),
        inBudget: isZerroInBudgetAccount(account),
        fxCode: instrumentCodeById[account.instrument],
      },
    ])
  )
}

export function getZerroDataAccountId(
  accounts: ById<TAccount>
): TAccountId | undefined {
  for (const id in accounts) {
    if (isZerroDataAccount(accounts[id])) return id
  }
}

/** The title identifies Zerro's storage account, including sparse patches that only contain changed fields. */
export function isZerroDataAccount(row: object): boolean {
  return (row as { title?: unknown }).title === ZERRO_DATA_ACCOUNT_NAME
}

export function getZerroInBudgetAccountIds(
  accounts: ById<TAccount>
): TAccountId[] {
  return getAccountList(accounts)
    .filter(isZerroInBudgetAccount)
    .map(account => account.id)
}

export function getZerroSavingAccounts(accounts: ById<TAccount>): TAccount[] {
  return getAccountList(accounts).filter(
    account =>
      !isZerroInBudgetAccount(account) &&
      account.type !== AccountType.Debt &&
      !isZerroDataAccount(account)
  )
}

export function isZerroInBudgetAccount(account: TAccount): boolean {
  if (account.type === AccountType.Debt) return false
  if (account.title.endsWith('📍')) return true
  return account.inBalance
}
