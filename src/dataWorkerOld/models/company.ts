import { Modify } from 'types'
import { isoToUnix, TISOTimestamp, TUnixTime, unixToISO } from './common'
import { TCountryId } from './country'

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
    changed: TISOTimestamp
  }
>

// Converter
export const convertCompany = {
  toClient: (el: TZmCompany): TCompany => ({
    ...el,
    changed: unixToISO(el.changed),
  }),
  toServer: (el: TCompany): TZmCompany => ({
    ...el,
    changed: isoToUnix(el.changed),
  }),
}
