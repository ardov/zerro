import { Modify } from '../ts-utils'
import { TUnixTime } from './common'
import { CountryId } from './Country'

export type CompanyId = number

export type ZmCompany = {
  id: CompanyId
  changed: TUnixTime
  title: string
  fullTitle: string | null
  www: string
  country: CountryId
  countryCode: string
  deleted: boolean
}

export type TCompany = Modify<
  ZmCompany,
  {
    changed: TISOTimestamp
  }
>
