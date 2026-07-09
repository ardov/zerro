import { ZERRO_DATA_ACCOUNT_NAME } from '../../constants'
import {
  AccountType,
  getAccountList,
  getAccounts,
  type TAccount,
  type TAccountId,
  type TAccountSource,
} from '../../zenmoney'

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
