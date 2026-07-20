import type { EntityPatch, ById, OptionalExceptFor } from '../shared/types'
import type { TCoreContext, TIntentPatch } from '../../types'
import type { TMsTime, TUnixTime } from './primitives'
import { compileEntityPatch, type TDataStore } from './store'
import type { TUserId } from './users'

export type TMerchantId = string
export type TMerchant = {
  id: TMerchantId
  changed: TMsTime
  user: TUserId
  title: string
}
/** Fields the factory cannot default: creation intent must supply them. */
export const merchantRequiredFields = [
  'title',
] as const satisfies readonly (keyof TMerchant)[]

export const merchantWritableFields = [
  'title',
] as const satisfies readonly (keyof TMerchant)[]
export type TMerchantWritableField = (typeof merchantWritableFields)[number]
export type TMerchantPatch = EntityPatch<TMerchant, TMerchantWritableField>
export type TZmMerchant = Omit<TMerchant, 'changed'> & { changed: TUnixTime }
export type TMerchantSource = Pick<TDataStore, 'merchant'>

export function getMerchants(data: TMerchantSource): ById<TMerchant> {
  return data.merchant
}
export function makeMerchant(
  draft: OptionalExceptFor<TMerchant, 'user' | 'title'>,
  ctx: TCoreContext
): TMerchant {
  return {
    user: draft.user,
    title: draft.title,
    id: draft.id || (ctx.uuid() as TMerchantId),
    changed: draft.changed || ctx.now(),
  }
}
export function compilePatchMerchant(
  data: TDataStore,
  patch: TMerchantPatch | TMerchantPatch[]
): TIntentPatch {
  return compileEntityPatch(data, 'merchant', patch)
}
