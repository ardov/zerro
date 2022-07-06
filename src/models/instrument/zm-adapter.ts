import { IInstrument, IZmInstrument } from 'shared/types'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { TZmAdapter } from 'shared/helpers/adapterUtils'

export const convertInstrument: TZmAdapter<IZmInstrument, IInstrument> = {
  toClient: (el: IZmInstrument): IInstrument => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: (el: IInstrument): IZmInstrument => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
