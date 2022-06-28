import { TInstrument, TZmInstrument } from './types'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { TZmAdapter } from 'shared/helpers/adapterUtils'

export const convertInstrument: TZmAdapter<TZmInstrument, TInstrument> = {
  toClient: (el: TZmInstrument): TInstrument => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: TInstrument): TZmInstrument => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
