import { ZERRO_DATA_ACCOUNT_NAME } from '../../../../constants'
import {
  AccountType,
  getAccStartBalance,
  getAccountList,
  getAccounts,
  type TAccount,
  type TAccountId,
  type TAccountSource,
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

/** Zerro's UI account projection; ZenMoney entities remain policy-free. */
export function getPopulatedAccounts(
  data: TAccountSource,
  instrumentCodeById: Record<TInstrumentId, TFxCode>
): ById<TAccountPopulated> {
  return Object.fromEntries(
    Object.entries(getAccounts(data)).map(([id, account]) => [
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
  data: TAccountSource
): TAccountId | undefined {
  const accounts = getAccounts(data)
  for (const id in accounts) {
    if (accounts[id].title === ZERRO_DATA_ACCOUNT_NAME) return id
  }
}

export function getZerroInBudgetAccountIds(data: TAccountSource): TAccountId[] {
  return getAccountList(data)
    .filter(isZerroInBudgetAccount)
    .map(account => account.id)
}

export function getZerroSavingAccounts(data: TAccountSource): TAccount[] {
  return getAccountList(data).filter(
    account =>
      !isZerroInBudgetAccount(account) &&
      account.type !== AccountType.Debt &&
      account.title !== ZERRO_DATA_ACCOUNT_NAME
  )
}

export function isZerroInBudgetAccount(account: TAccount): boolean {
  if (account.type === AccountType.Debt) return false
  if (account.title.endsWith('📍')) return true
  return account.inBalance
}
