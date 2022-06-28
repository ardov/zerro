import { TUserId } from 'models/user'
import { Modify, TMsTime, TObjectClass, TUnixTime } from 'shared/types'

export type TZmDeletionObject = {
  id: string | number
  object: TObjectClass
  stamp: TUnixTime
  user: TUserId
}

export type TDeletionObject = Modify<TZmDeletionObject, { stamp: TMsTime }>
