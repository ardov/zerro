import { TFxIdMap, TUser, TUserPopulated, TZmUser } from 'shared/types'
import { TZmAdapter } from 'shared/helpers/adapterUtils'
import { msToUnix, unixToMs } from 'shared/helpers/date'

export const convertUser: TZmAdapter<TZmUser, TUser> = {
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

export const populateUser = (
  user: TUser,
  fxIdMap: TFxIdMap
): TUserPopulated => {
  return {
    ...user,
    fxCode: fxIdMap[user.currency],
  }
}
