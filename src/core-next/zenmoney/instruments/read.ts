import type { ById, TDataStore } from '6-shared/types'
import type { TFxCode, TInstrument, TInstrumentId } from './types'

export function getInstruments(data: TDataStore): ById<TInstrument> {
  return data.instrument
}

export function getInstrument(
  data: TDataStore,
  id: TInstrumentId
): TInstrument | null {
  return data.instrument[id] || null
}

export function getInstrumentCode(
  data: TDataStore,
  id: TInstrumentId
): TFxCode | null {
  return getInstrument(data, id)?.shortTitle || null
}

export function getInstrumentCodeById(
  data: TDataStore
): Record<TInstrumentId, TFxCode> {
  return Object.fromEntries(
    Object.values(data.instrument).map(i => [i.id, i.shortTitle])
  )
}

export function getInstrumentsByCode(
  data: TDataStore
): Record<TFxCode, TInstrument> {
  return Object.fromEntries(
    Object.values(data.instrument).map(i => [i.shortTitle, i])
  )
}

export function getInstrumentByCode(
  data: TDataStore,
  code: TFxCode
): TInstrument | null {
  return getInstrumentsByCode(data)[code] || null
}
