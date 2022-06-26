import { TFxIdMap, TRawUser, TUser, TZmUser } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertUser: TZmAdapter<TZmUser, TRawUser> = {
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

export const populateUser = (user: TRawUser, fxIdMap: TFxIdMap): TUser => {
  return {
    ...user,
    fxCode: fxIdMap[user.currency],
  }
}
