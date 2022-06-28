import { TCountryId } from 'models/country'
import { Modify, TMsTime, TUnixTime } from 'shared/types'

export type TCompanyId = number

export type TZmCompany = {
  id: TCompanyId
  changed: TUnixTime
  title: string
  fullTitle: string | null
  www: string
  country: TCountryId
  countryCode: string
  deleted: boolean
}

export type TCompany = Modify<
  TZmCompany,
  {
    changed: TMsTime
  }
>
