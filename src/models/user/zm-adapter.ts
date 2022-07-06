import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'
import { IUser, IZmUser } from 'shared/types'

export const convertUser: TZmAdapter<IZmUser, IUser> = {
  toClient: el => {
    return {
      ...el,
      changed: unixToMs(el.changed),
      paidTill: unixToMs(el.paidTill),
    }
  },
  toServer: el => {
    return {
      ...el,
      changed: msToUnix(el.changed),
      paidTill: msToUnix(el.paidTill),
    }
  },
}
