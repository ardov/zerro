import { Modify, TMsTime, TUnixTime } from 'shared/types'

export type TInstrumentId = number
export type TFxCode = string

export type TZmInstrument = {
  id: TInstrumentId
  changed: TUnixTime
  title: string
  shortTitle: TFxCode
  symbol: string
  rate: number
}

export type TInstrument = Modify<
  TZmInstrument,
  {
    changed: TMsTime
  }
>

export type TFxIdMap = {
  [id: TInstrumentId]: TFxCode
}
