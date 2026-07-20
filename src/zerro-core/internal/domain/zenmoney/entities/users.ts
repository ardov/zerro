import type { TCountryId } from './countries'
import { getInstCodeMap, type TFxCode, type TInstrumentId } from './instruments'
import type { TMsTime, TUnixTime } from '../../foundation/primitives'
import type { ById } from '../../foundation/types'
import type { TInstrument } from './instruments'

export type TUserId = number
export type TUser = {
  id: TUserId
  changed: TMsTime
  currency: TInstrumentId
  parent: TUserId | null
  country: TCountryId
  countryCode: string
  email: string | null
  login: string | null
  monthStartDay: number
  isForecastEnabled: boolean
  planBalanceMode: string
  planSettings: string
  paidTill: TMsTime
  subscription: '10yearssubscription' | '1MonthSubscription' | string | null
  subscriptionRenewalDate: any | null
}
export type TZmUser = Omit<TUser, 'changed' | 'paidTill'> & {
  changed: TUnixTime
  paidTill: TUnixTime
}
export function getRootUser(users: ById<TUser>): TUser | null {
  return Object.values(users).find(user => !user.parent) || null
}
export function getRootUserId(users: ById<TUser>): TUserId | null {
  return getRootUser(users)?.id || null
}
export function getUserInstrumentId(users: ById<TUser>): TInstrumentId | null {
  return getRootUser(users)?.currency || null
}
export function getUserCurrency(data: {
  users: ById<TUser>
  instruments: ById<TInstrument>
}): TFxCode {
  const id = getUserInstrumentId(data.users)
  return typeof id === 'number'
    ? getInstCodeMap(data.instruments)[id] || 'USD'
    : 'USD'
}
