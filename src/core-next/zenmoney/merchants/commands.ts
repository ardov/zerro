import type { OptionalExceptFor, TDataStore } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { getMerchants } from './read'
import type { TMerchant } from './types'

export type TMerchantPatch = OptionalExceptFor<TMerchant, 'id'>

export function compilePatchMerchant(
  data: TDataStore,
  patch: TMerchantPatch | TMerchantPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(patch) ? patch : [patch]

  const merchants = getMerchants(data)

  return {
    merchant: list.map(patch => {
      if (!patch.id) throw new Error('Trying to patch merchant without id')

      const current = merchants[patch.id]
      if (!current) throw new Error('Merchant not found')

      return { ...current, ...patch, changed: ctx.now() }
    }),
  }
}
