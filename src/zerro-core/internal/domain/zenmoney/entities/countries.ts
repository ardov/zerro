import type { TInstrumentId } from './instruments'

export type TCountryId = number

/** Synchronized country reference data used by users and companies. */
export type TCountry = {
  id: TCountryId
  title: string
  currency: TInstrumentId
  domain: string | null
}

export type TZmCountry = TCountry
