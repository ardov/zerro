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
export type TUserSource = { user: ById<TUser> }
type TUserCurrencySource = TUserSource & { instrument: ById<TInstrument> }

export function getRootUser(data: TUserSource): TUser | null {
  return Object.values(data.user).find(user => !user.parent) || null
}
export function getRootUserId(data: TUserSource): TUserId | null {
  return getRootUser(data)?.id || null
}
export function getUserInstrumentId(data: TUserSource): TInstrumentId | null {
  return getRootUser(data)?.currency || null
}
export function getUserCurrency(data: TUserCurrencySource): TFxCode {
  const id = getUserInstrumentId(data)
  return typeof id === 'number' ? getInstCodeMap(data)[id] || 'USD' : 'USD'
}
