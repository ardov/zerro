import { TTransaction, TZmTransaction } from './types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertTransaction: TZmAdapter<TZmTransaction, TTransaction> = {
  toClient: (el: TZmTransaction): TTransaction => ({
    ...el,
    changed: unixToMs(el.changed),
    created: unixToMs(el.created),
  }),
  toServer: (el: TTransaction): TZmTransaction => ({
    ...el,
    changed: msToUnix(el.changed),
    created: msToUnix(el.created),
  }),
}
