import { TRawransaction, TZmTransaction } from 'types'
import { msToISODate, msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertTransaction: TZmAdapter<TZmTransaction, TRawransaction> = {
  toClient: (el: TZmTransaction): TRawransaction => ({
    ...el,
    changed: zmDateToMs(el.changed),
    created: zmDateToMs(el.created),
    date: zmDateToMs(el.date),
  }),
  toServer: (el: TRawransaction): TZmTransaction => ({
    ...el,
    changed: msToUnix(el.changed),
    created: msToUnix(el.created),
    date: msToISODate(el.date),
  }),
}
