import { ITransaction, IZmTransaction } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertTransaction: TZmAdapter<IZmTransaction, ITransaction> = {
  toClient: (el: IZmTransaction): ITransaction => ({
    ...el,
    changed: unixToMs(el.changed),
    created: unixToMs(el.created),
  }),
  toServer: (el: ITransaction): IZmTransaction => ({
    ...el,
    changed: msToUnix(el.changed),
    created: msToUnix(el.created),
  }),
}
