import type { TInstrumentId } from './instruments'

export type TCountryId = number

export type TCountry = {
  id: TCountryId
  title: string
  currency: TInstrumentId
  domain: string | null
}

export type TZmCountry = TCountry
