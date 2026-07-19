import type { EntityPatch } from '../../shared/types'
import type { TMsTime, TUnixTime } from '../primitives'
import type { TUserId } from '../users'

export type TMerchantId = string

export type TMerchant = {
  id: TMerchantId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  user: TUserId
  title: string
}

export const merchantWritableFields = [
  'title',
] as const satisfies readonly (keyof TMerchant)[]

export type TMerchantWritableField = (typeof merchantWritableFields)[number]

export type TMerchantPatch = EntityPatch<TMerchant, TMerchantWritableField>

export type TZmMerchant = Omit<TMerchant, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}
