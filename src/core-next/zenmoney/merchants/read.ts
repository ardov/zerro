import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TMerchant, TMerchantId } from './types'

export function getMerchants(data: TDataStore): ById<TMerchant> {
  return data.merchant
}
