import type { ById, TDataStore } from '6-shared/types'
import type { TCompany, TCompanyId } from './types'

export function getCompanies(data: TDataStore): ById<TCompany> {
  return data.company
}

export function getCompany(data: TDataStore, id: TCompanyId): TCompany | null {
  return data.company[id] || null
}
