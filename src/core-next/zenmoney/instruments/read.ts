import type { ById } from '../../shared/types'
import type { TDataStore } from '../store'
import type { TFxCode, TInstrument, TInstrumentId } from './types'

export function getInstruments(data: TDataStore): ById<TInstrument> {
  return data.instrument
}

/** Map of instrument IDs to currency codes. */
export function getInstCodeMap(
  data: TDataStore
): Record<TInstrumentId, TFxCode> {
  return Object.fromEntries(
    Object.values(data.instrument).map(i => [i.id, i.shortTitle])
  )
}

// TODO: used only in one place, remove later
/** Map of currency codes to instruments. */
export function getInstrumentsByCode(
  data: TDataStore
): Record<TFxCode, TInstrument> {
  return Object.fromEntries(
    Object.values(data.instrument).map(i => [i.shortTitle, i])
  )
}
