import type { OptionalExceptFor, TDataStore } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import { getMerchant } from './read'
import type { TMerchant } from './types'

export type TMerchantPatch = OptionalExceptFor<TMerchant, 'id'>

export function compilePatchMerchant(
  data: TDataStore,
  patch: TMerchantPatch | TMerchantPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(patch) ? patch : [patch]

  return {
    merchant: list.map(item => {
      if (!item.id) throw new Error('Trying to patch merchant without id')

      const current = getMerchant(data, item.id)
      if (!current) throw new Error('Merchant not found')

      return { ...current, ...item, changed: ctx.now() }
    }),
  }
}
