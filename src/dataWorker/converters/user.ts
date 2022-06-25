import { TFxIdMap, TRawUser, TUser, TZmUser } from 'shared/types'
import { msToUnix, TZmAdapter, zmDateToMs } from './utils'

export const convertUser: TZmAdapter<TZmUser, TRawUser> = {
  toClient: el => {
    return {
      ...el,
      changed: zmDateToMs(el.changed),
      paidTill: zmDateToMs(el.paidTill),
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
