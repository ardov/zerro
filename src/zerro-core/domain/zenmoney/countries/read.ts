import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TCountry } from './types'

export function getCountries(data: TDataStore): ById<TCountry> {
  return data.country
}
