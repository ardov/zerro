import { TCountry, TZmCountry } from './types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'

export const convertCountry: TZmAdapter<TZmCountry, TCountry> = {
  toClient: el => el,
  toServer: el => el,
}
