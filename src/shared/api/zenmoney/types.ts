// TODO: questionable reexport, maybe move types here?
export type { TZmDiff, TZmRequest } from 'models/diff'

export type TAccessToken = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

export type TToken = TAccessToken['access_token']
