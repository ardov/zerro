import type { ById, TDataStore } from '6-shared/types'
import type { TCountry } from './types'

export function getCountries(data: TDataStore): ById<TCountry> {
  return data.country
}
