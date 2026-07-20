import type { ById } from '../../foundation/types'
import type { TMsTime, TUnixTime } from '../../foundation/primitives'

export type TInstrumentId = number
export type TFxCode = string

export type TInstrument = {
  id: TInstrumentId
  changed: TMsTime
  title: string
  shortTitle: TFxCode
  symbol: string
  rate: number
}

export type TZmInstrument = Omit<TInstrument, 'changed'> & {
  changed: TUnixTime
}
export type TInstrumentSource = { instrument: ById<TInstrument> }
export type TInstrumentCodeMap = Record<TInstrumentId, TFxCode>

export function getInstruments(data: TInstrumentSource): ById<TInstrument> {
  return data.instrument
}

export function getInstCodeMap(data: TInstrumentSource): TInstrumentCodeMap {
  return Object.fromEntries(
    Object.values(data.instrument).map(i => [i.id, i.shortTitle])
  )
}

export function getInstrumentsByCode(
  data: TInstrumentSource
): Record<TFxCode, TInstrument> {
  return Object.fromEntries(
    Object.values(data.instrument).map(i => [i.shortTitle, i])
  )
}
