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
export type TInstrumentCodeMap = Record<TInstrumentId, TFxCode>

export function getInstCodeMap(
  instruments: ById<TInstrument>
): TInstrumentCodeMap {
  return Object.fromEntries(
    Object.values(instruments).map(i => [i.id, i.shortTitle])
  )
}

export function getInstrumentsByCode(
  instruments: ById<TInstrument>
): Record<TFxCode, TInstrument> {
  return Object.fromEntries(
    Object.values(instruments).map(i => [i.shortTitle, i])
  )
}
