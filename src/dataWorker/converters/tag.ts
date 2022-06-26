import { TRawTag, TZmTag } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertTag: TZmAdapter<TZmTag, TRawTag> = {
  toClient: el => {
    return { ...el, changed: unixToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
