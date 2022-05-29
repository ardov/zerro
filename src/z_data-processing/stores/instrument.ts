import { combine, createEvent, createStore } from 'effector'
import { unixToISO } from './utils'
import { ById, TFxIdMap, TInstrument, ZmInstrument } from '../types'

// Events
export const setRawInstruments = createEvent<ZmInstrument[]>()
export const resetInstruments = createEvent()

// Store
export const $rawInstruments = createStore<ZmInstrument[]>([])

$rawInstruments
  .on(setRawInstruments, (_, rawInstruments) => rawInstruments)
  .on(resetInstruments, () => [])
  .watch(state => {
    console.log('instruments created')
  })

// Derivatives
export const $instruments = combine($rawInstruments, processInstruments)
export const $fxIdMap = combine($rawInstruments, getFxIdMap)

// Functions

/**
 * Converts instruments to mapping which is used by other converters
 */
function getFxIdMap(instruments: ZmInstrument[]): TFxIdMap {
  let result: TFxIdMap = {}
  instruments.forEach(({ id, shortTitle }) => {
    result[id] = shortTitle
  })
  return result
}

/**
 * Converts ZmInstrument to TInstrument
 */
function convertInstrument(raw: ZmInstrument): TInstrument {
  return { ...raw, changed: unixToISO(raw.changed) }
}

/**
 * Converts collection of instruments
 */
function processInstruments(instruments: ZmInstrument[]): ById<TInstrument> {
  let result: ById<TInstrument> = {}
  instruments.forEach(raw => {
    result[raw.shortTitle] = convertInstrument(raw)
  })
  return result
}
