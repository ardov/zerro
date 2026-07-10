import { useAppSelector } from 'store'
import { getMerchants } from './model'
import { makeMerchant } from './makeMerchant'

export type { TMerchantDraft } from './makeMerchant'

export const merchantModel = {
  // Selectors
  getMerchants,

  // Hooks
  useMerchants: () => useAppSelector(getMerchants),

  // Actions
  makeMerchant,
}
