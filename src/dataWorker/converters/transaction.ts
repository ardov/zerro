import { TRawTransaction, TZmTransaction } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertTransaction: TZmAdapter<TZmTransaction, TRawTransaction> = {
  toClient: (el: TZmTransaction): TRawTransaction => ({
    ...el,
    changed: unixToMs(el.changed),
    created: unixToMs(el.created),
  }),
  toServer: (el: TRawTransaction): TZmTransaction => ({
    ...el,
    changed: msToUnix(el.changed),
    created: msToUnix(el.created),
  }),
}
