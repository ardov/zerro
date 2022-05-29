import { combine, createEvent, createStore } from 'effector'
import { unixToISO } from './utils'
import { ById, TFxIdMap, TInstrument, ZmInstrument } from '../types'

// Events
export const setRawInstruments = createEvent<ZmInstrument[]>()

// Store
export const $rawInstruments = createStore<ZmInstrument[]>([])
$rawInstruments.on(setRawInstruments, (_, rawInstruments) => rawInstruments)

// Derivatives
export const $instruments = $rawInstruments.map(processInstruments)
export const $fxIdMap = $rawInstruments.map(getFxIdMap)

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

/** Converts instruments to mapping which is used by other converters */
function getFxIdMap(instruments: ZmInstrument[]): TFxIdMap {
  let result: TFxIdMap = {}
  instruments.forEach(({ id, shortTitle }) => {
    result[id] = shortTitle
  })
  return result
}

/** Converts Zm format to local */
function convertInstrument(raw: ZmInstrument): TInstrument {
  return { ...raw, changed: unixToISO(raw.changed) }
}

/** Converts collection of instruments */
function processInstruments(instruments: ZmInstrument[]): ById<TInstrument> {
  let result: ById<TInstrument> = {}
  instruments.forEach(raw => {
    result[raw.shortTitle] = convertInstrument(raw)
  })
  return result
}
