import type { TCountryId } from '../countries'
import type { TInstrumentId } from '../instruments'
import type { TMsTime, TUnixTime } from '../primitives'

export type TUserId = number

export type TUser = {
  id: TUserId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  /** User base currency as an instrument id. */
  currency: TInstrumentId

  /** Root user has no parent. Child users point to the root user id. */
  parent: TUserId | null

  country: TCountryId

  countryCode: string
  email: string | null
  login: string | null

  /** Month start day. Used for analytics in ZenMoney. Usually 1. */
  monthStartDay: number

  isForecastEnabled: boolean

  /** Usually `balance` in current ZenMoney data. */
  planBalanceMode: string

  /** Serialized ZenMoney planning settings. */
  planSettings: string

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  paidTill: TMsTime

  subscription: '10yearssubscription' | '1MonthSubscription' | string

  /** Shape is controlled by ZenMoney sync data and is not normalized yet. */
  subscriptionRenewalDate: any | null
}

export type TZmUser = Omit<TUser, 'changed' | 'paidTill'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime

  /** ZenMoney wire timestamp in seconds. */
  paidTill: TUnixTime
}
