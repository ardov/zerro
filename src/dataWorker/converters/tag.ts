import { TRawTag, TZmTag } from 'shared/types'
import { msToUnix, TZmAdapter, zmDateToMs } from 'shared/helpers/adapterUtils'

export const convertTag: TZmAdapter<TZmTag, TRawTag> = {
  toClient: el => {
    return { ...el, changed: zmDateToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
