import { TRawTransaction, TZmTransaction } from 'shared/types'
import {
  toISODate,
  msToUnix,
  TZmAdapter,
  zmDateToMs,
} from 'shared/helpers/adapterUtils'

export const convertTransaction: TZmAdapter<TZmTransaction, TRawTransaction> = {
  toClient: (el: TZmTransaction): TRawTransaction => ({
    ...el,
    changed: zmDateToMs(el.changed),
    created: zmDateToMs(el.created),
  }),
  toServer: (el: TRawTransaction): TZmTransaction => ({
    ...el,
    changed: msToUnix(el.changed),
    created: msToUnix(el.created),
  }),
}
