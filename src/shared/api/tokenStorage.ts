import { TToken } from '@shared/types'

const TOKEN_KEY = 'zm_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY) as TToken,
  set: (token: TToken) =>
    token
      ? localStorage.setItem(TOKEN_KEY, token)
      : localStorage.removeItem(TOKEN_KEY),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}
