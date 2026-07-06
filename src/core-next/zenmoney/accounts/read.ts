import type { ById, TDataStore } from '6-shared/types'
import { ZERRO_DATA_ACCOUNT_NAME } from '../../constants'
import { getInstrumentCodeById } from '../instruments'
import type { TFxCode } from '../instruments'
import { AccountType, type TAccount, type TAccountId } from './types'

export type TAccountWithFxCode = {
  id: TAccountId
  balance: number
  fxCode: TFxCode
}

export type TAccountBalanceInput = TAccountWithFxCode & {
  type: AccountType
}

export function getAccounts(data: TDataStore): ById<TAccount> {
  return data.account
}

export function getAccount(
  data: TDataStore,
  id: TAccountId
): TAccount | null {
  return getAccounts(data)[id] || null
}

export function getAccountList(data: TDataStore): TAccount[] {
  return Object.values(getAccounts(data))
}

export function getDebtAccountId(data: TDataStore): TAccountId | undefined {
  return getAccountList(data).find(account => account.type === AccountType.Debt)
    ?.id
}

export function getSavingAccounts(data: TDataStore): TAccount[] {
  return getAccountList(data).filter(
    account =>
      !isInBudgetAccount(account) &&
      account.type !== AccountType.Debt &&
      account.title !== ZERRO_DATA_ACCOUNT_NAME
  )
}

export function getInBudgetAccounts(data: TDataStore): TAccountWithFxCode[] {
  const instrumentCodeById = getInstrumentCodeById(data)
  return getAccountList(data)
    .filter(isInBudgetAccount)
    .map(account => ({
      id: account.id,
      balance: account.balance,
      fxCode: instrumentCodeById[account.instrument],
    }))
}

export function getBalanceAccounts(
  data: TDataStore
): ById<TAccountBalanceInput> {
  const instrumentCodeById = getInstrumentCodeById(data)
  const result: ById<TAccountBalanceInput> = {}

  getAccountList(data).forEach(account => {
    result[account.id] = {
      id: account.id,
      type: account.type,
      fxCode: instrumentCodeById[account.instrument],
      balance: account.balance,
    }
  })

  return result
}

export function isInBudgetAccount(account: TAccount): boolean {
  if (account.type === AccountType.Debt) return false
  if (account.title.endsWith('📍')) return true
  return account.inBalance
}
