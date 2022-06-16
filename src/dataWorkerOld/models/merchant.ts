import { Modify } from 'types'
import { isoToUnix, TISOTimestamp, TUnixTime, unixToISO } from './common'
import { TUserId } from './user'

export type TMerchantId = string // UUID

export type TZmMerchant = {
  id: TMerchantId
  changed: TUnixTime
  user: TUserId
  title: string
}

export type TMerchant = Modify<
  TZmMerchant,
  {
    changed: TISOTimestamp
  }
>

// Converter
export const convertMerchant = {
  toClient: (el: TZmMerchant): TMerchant => ({
    ...el,
    changed: unixToISO(el.changed),
  }),
  toServer: (el: TMerchant): TZmMerchant => ({
    ...el,
    changed: isoToUnix(el.changed),
  }),
}
