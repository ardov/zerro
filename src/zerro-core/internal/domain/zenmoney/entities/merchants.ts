import type {
  EntityPatch,
  ById,
  OptionalExceptFor,
} from '../../foundation/types'
import type { TCompiled, TCoreContext } from '../../../../types'
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
/** Canonical payee key used by ZenMoney. Merchant titles and free-text payees
 * share one namespace, and this is how that namespace is keyed. */
export function normalizePayee(name: string | null | undefined) {
  return (name || '')
    .replace(/[\s.,;!?():\-"'&«»„”`*]+/g, ' ')
    .trim()
    .toLowerCase()
}

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

export type TCreateMerchantReceipt = { merchantId: TMerchantId }

/** Titles are one namespace, so a merchant that already carries this title is
 * named by the receipt instead of being doubled. */
export function compileCreateMerchant(
  merchants: ById<TMerchant>,
  rawTitle: string,
  ctx: TCoreContext
): TCompiled<TCreateMerchantReceipt> {
  const title = rawTitle.trim()
  if (!title) throw new Error('Trying to create merchant without title')

  const existing = findMerchantByTitle(merchants, title)
  if (existing) return { patch: {}, receipt: { merchantId: existing.id } }

  const id = ctx.uuid() as TMerchantId
  return {
    patch: { merchant: [{ id, title }] },
    receipt: { merchantId: id },
  }
}

function findMerchantByTitle(
  merchants: ById<TMerchant>,
  title: string
): TMerchant | undefined {
  const key = normalizePayee(title)
  return Object.values(merchants).find(
    merchant => normalizePayee(merchant.title) === key
  )
}
