import { ById, TCountry, TFxIdMap, ZmCountry } from '../types'

function convertCountry(raw: ZmCountry, fxIdMap: TFxIdMap): TCountry {
  return {
    ...raw,
    fxCode: fxIdMap[raw.currency],
  }
}

export function processCountries(
  countries: ById<ZmCountry>,
  fxIdMap: TFxIdMap
): ById<TCountry> {
  return Object.fromEntries(
    Object.entries(countries).map(([id, raw]) => [
      id,
      convertCountry(raw, fxIdMap),
    ])
  )
}
