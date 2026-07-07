import type { ById, TDataStore } from '6-shared/types'
import type { TCompany } from './types'

export function getCompanies(data: TDataStore): ById<TCompany> {
  return data.company
}
