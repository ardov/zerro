import { InstrumentId } from './Instrument'
import { CountryId } from './Country'
import { TUnixTime } from './common'
import { Modify } from '../ts-utils'

export type UserId = number

export type ZmUser = {
  id: UserId
  changed: TUnixTime
  currency: InstrumentId
  parent: UserId | null
  country: CountryId
  countryCode: string
  email: string | null
  login: string | null
  monthStartDay: 1
  paidTill: TUnixTime
  subscription: '10yearssubscription' | '1MonthSubscription' | string
}

export type TUser = Modify<
  ZmUser,
  {
    // Converted
    changed: TISOTimestamp
    paidTill: TISOTimestamp

    // Custom fields
    fxCode: TFxCode
  }
>
