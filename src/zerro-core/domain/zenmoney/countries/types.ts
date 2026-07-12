import type { TInstrumentId } from '../instruments'

export type TCountryId = number

export type TCountry = {
  id: TCountryId
  title: string

  /** Country default currency as an instrument id. */
  currency: TInstrumentId

  /** Country-specific ZenMoney domain when provided by reference data. */
  domain: string | null
}

export type TZmCountry = TCountry
