import type { TDataStore } from '../store'
import type { TIntentPatch } from '../../../types'
import { getMerchants } from './read'
import type { TMerchantPatch } from './types'

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
