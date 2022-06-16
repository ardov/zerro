import { TRawAccount, TZmAccount } from 'types'
import { msToISODate, msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertAccount: TZmAdapter<TZmAccount, TRawAccount> = {
  toClient: el => {
    return {
      ...el,
      changed: zmDateToMs(el.changed),
      startDate: el.startDate === null ? null : zmDateToMs(el.startDate),
    }
  },
  toServer: el => {
    return {
      ...el,
      changed: msToUnix(el.changed),
      startDate: el.startDate === null ? null : msToISODate(el.startDate),
    }
  },
}
