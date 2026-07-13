import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TMerchant } from './types'

export type TMerchantSource = Pick<TDataStore, 'merchant'>

export function getMerchants(data: TMerchantSource): ById<TMerchant> {
  return data.merchant
}
