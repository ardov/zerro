import type { TAccountId } from '@/6-shared/types'
import { safeLocalStorage } from '@/6-shared/api/browserStorage'

const LAST_ACCOUNT_KEY = 'transaction-create:last-account'

export function loadLastTransactionAccount(): TAccountId | null {
  return safeLocalStorage.getItem(LAST_ACCOUNT_KEY)
}

export function saveLastTransactionAccount(accountId: TAccountId): void {
  safeLocalStorage.setItem(LAST_ACCOUNT_KEY, accountId)
}
