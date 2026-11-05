import type { TCountryId } from './countries'
import type { TFxCode, TInstrumentCodeMap, TInstrumentId } from './instruments'
import type { TMsTime, TUnixTime } from '../../foundation/primitives'
import type { ById, EntityPatch } from '../../foundation/types'

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

/** Restore may only change these root-user preferences. */
export const userWritableFields = [
  'currency',
  'monthStartDay',
] as const satisfies readonly (keyof TUser)[]
export type TUserWritableField = (typeof userWritableFields)[number]
export type TUserPatch = EntityPatch<TUser, TUserWritableField>
export type TUserIntent = { user: TUserPatch[] }

export function getRootUser(users: ById<TUser>): TUser | null {
  return Object.values(users).find(user => !user.parent) || null
}
export function getRootUserId(users: ById<TUser>): TUserId | null {
  return getRootUser(users)?.id || null
}
export function getUserInstrumentId(users: ById<TUser>): TInstrumentId | null {
  return getRootUser(users)?.currency || null
}
/** The root user's currency code, or USD when it cannot be resolved. */
export function getUserCurrency(data: {
  users: ById<TUser>
  instrumentCodes: TInstrumentCodeMap
}): TFxCode {
  const id = getUserInstrumentId(data.users)
  return typeof id === 'number' ? data.instrumentCodes[id] || 'USD' : 'USD'
}
