import { TRawAccount, TZmAccount } from 'shared/types'
import {
  toISODate,
  msToUnix,
  TZmAdapter,
  zmDateToMs,
} from 'shared/helpers/adapterUtils'

export const convertAccount: TZmAdapter<TZmAccount, TRawAccount> = {
  toClient: el => {
    return {
      ...el,
      changed: zmDateToMs(el.changed),
      // startDate: el.startDate === null ? null : zmDateToMs(el.startDate),
    }
  },
  toServer: el => {
    return {
      ...el,
      changed: msToUnix(el.changed),
      // startDate: el.startDate === null ? null : msToISODate(el.startDate),
    }
  },
}
