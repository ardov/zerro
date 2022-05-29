import { Modify } from '../ts-utils'
import { InstrumentId, TFxCode } from './Instrument'

export type CountryId = number

export type ZmCountry = {
  id: CountryId
  title: string
  currency: InstrumentId
  domain: string
}

export type TCountry = Modify<
  ZmCountry,
  {
    // Custom fields
    fxCode: TFxCode
  }
>
