import { TRawTag, TZmTag } from 'types'
import { msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertTag: TZmAdapter<TZmTag, TRawTag> = {
  toClient: el => {
    return { ...el, changed: zmDateToMs(el.changed) }
  },
  toServer: el => {
    return { ...el, changed: msToUnix(el.changed) }
  },
}
