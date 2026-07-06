import type { ById, TDataStore } from '6-shared/types'
import type { TFxCode, TInstrument, TInstrumentId } from './types'

export type TInstrumentCodeById = Record<TInstrumentId, TFxCode>

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

export function getInstrumentCodeById(data: TDataStore): TInstrumentCodeById {
  const result: TInstrumentCodeById = {}

  Object.values(data.instrument).forEach(instrument => {
    result[instrument.id] = instrument.shortTitle
  })

  return result
}

export function getInstrumentsByCode(
  data: TDataStore
): Record<TFxCode, TInstrument> {
  const result: Record<TFxCode, TInstrument> = {}

  Object.values(data.instrument).forEach(instrument => {
    result[instrument.shortTitle] = instrument
  })

  return result
}

export function getInstrumentByCode(
  data: TDataStore,
  code: TFxCode
): TInstrument | null {
  return getInstrumentsByCode(data)[code] || null
}
