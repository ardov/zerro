import { convertInstrument, getFxIdMap } from 'dataWorker/converters/instrument'
import { createStore } from 'effector'
import {
  ById,
  TFxCode,
  TInstrument,
  TInstrumentId,
  TZmInstrument,
} from 'shared/types'

const $zmInstruments = createStore<ById<TZmInstrument>>({})

export const $instruments = $zmInstruments.map(transformInstruments)
export const $fxIdMap = $instruments.map(getFxIdMap)

function transformInstruments(instruments: ById<TZmInstrument>) {
  let result: Record<TFxCode, TInstrument> = {}
  for (let id in instruments) {
    const fxCode = instruments[id].shortTitle
    result[fxCode] = convertInstrument.toClient(instruments[id])
  }
  return result
}

function transformRecords<In, Out>(
  records: ById<In>,
  mapper: (record: In) => Out
) {
  let result: ById<Out> = {}
  for (let id in records) {
    result[id] = mapper(records[id])
  }
  return result
}
