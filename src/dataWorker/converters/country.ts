import { TRawCountry, TZmCountry } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'

export const convertCountry: TZmAdapter<TZmCountry, TRawCountry> = {
  toClient: el => el,
  toServer: el => el,
}
