import { TInstrumentId, TFxCode, TFxIdMap } from './instrument'

export type TCountryId = number

export type TZmCountry = {
  id: TCountryId
  title: string
  currency: TInstrumentId
  domain: string
}

export type TCountry = TZmCountry & {
  // Custom fields
  fxCode: TFxCode
}

// Converter
export const convertCountry = {
  toClient: (el: TZmCountry, fxIdMap: TFxIdMap): TCountry => ({
    ...el,
    fxCode: fxIdMap[el.currency],
  }),
  toServer: (el: TCountry): TZmCountry => {
    const res = {
      ...el,
      fxCode: undefined,
    }
    delete res.fxCode
    return res
  },
}
