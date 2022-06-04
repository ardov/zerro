import { Modify } from '../ts-utils'
import { TISOTimestamp, TUnixTime } from './common'

export type InstrumentId = number
export type TFxCode = string

export type ZmInstrument = {
  id: InstrumentId
  changed: TUnixTime
  title: string
  shortTitle: TFxCode
  symbol: string
  rate: number
}

export type TInstrument = Modify<
  ZmInstrument,
  {
    changed: TISOTimestamp
  }
>

export type TFxIdMap = {
  [id: InstrumentId]: TFxCode
}
