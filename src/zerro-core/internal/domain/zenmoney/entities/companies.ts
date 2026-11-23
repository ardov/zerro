import type { TCountryId } from './countries'
import type { TMsTime, TUnixTime } from '../primitives'

export type TCompanyId = number

export type TCompany = {
  id: TCompanyId
  changed: TMsTime
  title: string
  fullTitle: string | null
  www: string | null
  country: TCountryId | null
  countryCode: string | null
  deleted: boolean
}

export type TZmCompany = Omit<TCompany, 'changed'> & { changed: TUnixTime }
