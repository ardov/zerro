import type {
  EntityPatch,
  ById,
  OptionalExceptFor,
} from '../../foundation/types'
import type { TCoreContext } from '../../../../types'
import type { TMsTime, TUnixTime } from '../../foundation/primitives'
import { compileExistingEntityPatch } from './patch'
import type { TUserId } from './users'

export type TMerchantId = string
export type TMerchant = {
  id: TMerchantId
  changed: TMsTime
  user: TUserId
  title: string
  /** Observed in complete snapshots; write semantics are not established. */
  mcc?: number | null
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
export type TMerchantIntent = { merchant: TMerchantPatch[] }
export function makeMerchant(
  draft: OptionalExceptFor<TMerchant, 'user' | 'title'>,
  ctx: TCoreContext
): TMerchant {
  return {
    user: draft.user,
    title: draft.title,
    id: draft.id ?? (ctx.uuid() as TMerchantId),
    changed: draft.changed ?? ctx.now(),
  }
}
export function compilePatchMerchant(
  merchants: ById<TMerchant>,
  patch: TMerchantPatch | TMerchantPatch[]
): TMerchantIntent {
  return compileExistingEntityPatch(merchants, 'merchant', patch)
}
