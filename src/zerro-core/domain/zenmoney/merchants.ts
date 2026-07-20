import type { EntityPatch, ById, OptionalExceptFor } from '../shared/types'
import type { TCoreContext, TIntentPatch } from '../../types'
import type { TMsTime, TUnixTime } from './primitives'
import type { TDataStore } from './store'
import type { TUserId } from './users'

export type TMerchantId = string
export type TMerchant = {
  id: TMerchantId
  changed: TMsTime
  user: TUserId
  title: string
}
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
  const list = Array.isArray(patch) ? patch : [patch]
  const merchants = getMerchants(data)
  list.forEach(item => {
    if (!item.id) throw new Error('Trying to patch merchant without id')
    if (!merchants[item.id]) throw new Error('Merchant not found')
  })
  return { merchant: list }
}
