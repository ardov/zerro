import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TCompany } from './types'

export function getCompanies(data: TDataStore): ById<TCompany> {
  return data.company
}
