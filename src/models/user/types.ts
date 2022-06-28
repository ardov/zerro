import { TCountryId } from 'models/country'
import { TInstrumentId } from 'models/instrument'
import { Modify, TMsTime, TUnixTime } from 'shared/types'

export type TUserId = number

export type TZmUser = {
  id: TUserId
  changed: TUnixTime
  currency: TInstrumentId
  parent: TUserId | null
  country: TCountryId
  countryCode: string
  email: string | null
  login: string | null
  monthStartDay: 1
  paidTill: TUnixTime
  subscription: '10yearssubscription' | '1MonthSubscription' | string
}

export type TUser = Modify<
  TZmUser,
  {
    changed: TMsTime
    paidTill: TMsTime
  }
>
