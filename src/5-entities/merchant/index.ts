import { useAppSelector } from 'store'
import { getMerchants } from './model'
import { patchMerchant } from './patchMerchant'
import { makeMerchant } from './makeMerchant'

export type { TMerchantPatch } from './patchMerchant'
export type { TMerchantDraft } from './makeMerchant'

export const merchantModel = {
  // Selectors
  getMerchants,

  // Hooks
  useMerchants: () => useAppSelector(getMerchants),

  // Actions
  makeMerchant,

  // Thunks
  patchMerchant,
}
