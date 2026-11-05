import type { TToken } from '@/6-shared/types'
import { safeLocalStorage } from './browserStorage'

const TOKEN_KEY = 'zm_token'

export const tokenStorage = {
  get: () => safeLocalStorage.getItem(TOKEN_KEY) as TToken,
  set: (token: TToken) =>
    token
      ? safeLocalStorage.setItem(TOKEN_KEY, token)
      : safeLocalStorage.removeItem(TOKEN_KEY),
  clear: () => safeLocalStorage.removeItem(TOKEN_KEY),
}
