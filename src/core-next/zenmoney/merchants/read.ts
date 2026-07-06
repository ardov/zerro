import type { ById, TDataStore } from '6-shared/types'
import type { TMerchant, TMerchantId } from './types'

export function getMerchants(data: TDataStore): ById<TMerchant> {
  return data.merchant
}

export function getMerchant(
  data: TDataStore,
  id: TMerchantId
): TMerchant | null {
  return getMerchants(data)[id] || null
}
