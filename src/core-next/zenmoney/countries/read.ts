import type { ById, TDataStore } from '6-shared/types'
import type { TCountry, TCountryId } from './types'

export function getCountries(data: TDataStore): ById<TCountry> {
  return data.country
}

export function getCountry(data: TDataStore, id: TCountryId): TCountry | null {
  return data.country[id] || null
}
