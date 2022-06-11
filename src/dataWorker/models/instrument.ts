import type { Modify } from 'types'
import { isoToUnix, TISOTimestamp, TUnixTime, unixToISO } from './common'

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
    changed: TISOTimestamp
  }
>

export type TFxIdMap = {
  [id: TInstrumentId]: TFxCode
}

// Converter
export const convertInstrument = {
  toClient: (el: TZmInstrument): TInstrument => ({
    ...el,
    changed: unixToISO(el.changed),
  }),
  toServer: (el: TInstrument): TZmInstrument => ({
    ...el,
    changed: isoToUnix(el.changed),
  }),
}

// Extract FX to InstrumentId map
export const extractFxIdMap = (instruments: TInstrument[]): TFxIdMap =>
  instruments.reduce(
    (acc, curr) => ({ ...acc, [curr.id]: curr.shortTitle }),
    {} as TFxIdMap
  )
