import { TRawCountry, TZmCountry } from 'types'
import { TZmAdapter } from './utils'

export const convertCountry: TZmAdapter<TZmCountry, TRawCountry> = {
  toClient: el => el,
  toServer: el => el,
}
