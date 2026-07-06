import type { OptionalExceptFor, TDataStore, TMerchant } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'

export type TZenMoneyMerchantPatch = OptionalExceptFor<TMerchant, 'id'>

export function compilePatchMerchant(
  data: TDataStore,
  patch: TZenMoneyMerchantPatch | TZenMoneyMerchantPatch[],
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  const list = Array.isArray(patch) ? patch : [patch]

  return {
    merchant: list.map(item => {
      if (!item.id) throw new Error('Trying to patch merchant without id')

      const current = data.merchant[item.id]
      if (!current) throw new Error('Merchant not found')

      return { ...current, ...item, changed: ctx.now() }
    }),
  }
}
