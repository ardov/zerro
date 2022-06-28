import { TUserId } from 'models/user'
import { Modify, TMsTime, TUnixTime } from 'shared/types'

export type TMerchantId = string

export type TZmMerchant = {
  id: TMerchantId
  changed: TUnixTime
  user: TUserId
  title: string
}

export type TMerchant = Modify<
  TZmMerchant,
  {
    changed: TMsTime
  }
>
