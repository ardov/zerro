import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { TDeletionObject, TZmDeletionObject } from './types'

export const convertDeletion: TZmAdapter<TZmDeletionObject, TDeletionObject> = {
  toClient: (el: TZmDeletionObject): TDeletionObject => {
    return { ...el, stamp: unixToMs(el.stamp) }
  },
  toServer: (el: TDeletionObject): TZmDeletionObject => {
    return { ...el, stamp: msToUnix(el.stamp) }
  },
}
