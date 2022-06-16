import { TDeletionObject, TZmDeletionObject } from 'types'
import { msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertDeletion: TZmAdapter<TZmDeletionObject, TDeletionObject> = {
  toClient: (el: TZmDeletionObject): TDeletionObject => {
    return { ...el, stamp: zmDateToMs(el.stamp) }
  },
  toServer: (el: TDeletionObject): TZmDeletionObject => {
    return { ...el, stamp: msToUnix(el.stamp) }
  },
}
