import type { TInstrumentId } from 'models/instrument'

export type TCountryId = number

export type TZmCountry = {
  id: TCountryId
  title: string
  currency: TInstrumentId
  domain: string
}

export type TCountry = TZmCountry
