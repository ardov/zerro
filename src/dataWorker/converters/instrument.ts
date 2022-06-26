import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { ById, TFxIdMap, TInstrument, TZmInstrument } from 'shared/types'

export const convertInstrument: TZmAdapter<TZmInstrument, TInstrument> = {
  toClient: (el: TZmInstrument): TInstrument => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: TInstrument): TZmInstrument => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}

export const getFxIdMap = (currencies: ById<TInstrument>): TFxIdMap => {
  const fxIdMap: TFxIdMap = {}
  Object.values(currencies).forEach(curr => {
    fxIdMap[curr.id] = curr.shortTitle
  })
  return fxIdMap
}

export const getCurrenciesByShortCode = (
  currencies: ById<TInstrument>
): ById<TInstrument> => {
  const result: ById<TInstrument> = {}
  Object.values(currencies).forEach(curr => {
    result[curr.shortTitle] = curr
  })
  return result
}
