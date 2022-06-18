import { TRawTransaction, TZmTransaction } from 'types'
import { msToISODate, msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertTransaction: TZmAdapter<TZmTransaction, TRawTransaction> = {
  toClient: (el: TZmTransaction): TRawTransaction => ({
    ...el,
    changed: zmDateToMs(el.changed),
    created: zmDateToMs(el.created),
    date: zmDateToMs(el.date),
  }),
  toServer: (el: TRawTransaction): TZmTransaction => ({
    ...el,
    changed: msToUnix(el.changed),
    created: msToUnix(el.created),
    date: msToISODate(el.date),
  }),
}
