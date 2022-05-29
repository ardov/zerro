import { Modify } from '../ts-utils'
import { TUnixTime } from './common'
import { UserId } from './User'

export type MerchantId = string // UUID

export type ZmMerchant = {
  id: MerchantId
  changed: TUnixTime
  user: UserId
  title: string
}

export type TMerchant = Modify<
  ZmMerchant,
  {
    changed: TISOTimestamp
  }
>
