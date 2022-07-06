import { ICountry, IZmCountry } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'

export const convertCountry: TZmAdapter<IZmCountry, ICountry> = {
  toClient: el => el,
  toServer: el => el,
}
