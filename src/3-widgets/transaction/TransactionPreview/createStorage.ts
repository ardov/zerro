import type { TAccountId } from '@/6-shared/types'

const LAST_ACCOUNT_KEY = 'transaction-create:last-account'

export function loadLastTransactionAccount(): TAccountId | null {
  try {
    return localStorage.getItem(LAST_ACCOUNT_KEY)
  } catch {
    return null
  }
}

export function saveLastTransactionAccount(accountId: TAccountId): void {
  try {
    localStorage.setItem(LAST_ACCOUNT_KEY, accountId)
  } catch {
    // Remembering an account is optional when browser storage is unavailable.
  }
}
