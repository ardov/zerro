import { TUserId } from 'models/user'
import { Modify, TMsTime, TUnixTime } from 'shared/types'

export enum EntityType {
  Instrument = 'instrument',
  Country = 'country',
  Company = 'company',
  User = 'user',
  Account = 'account',
  Merchant = 'merchant',
  Tag = 'tag',
  Budget = 'budget',
  Reminder = 'reminder',
  ReminderMarker = 'reminderMarker',
  Transaction = 'transaction',
}

export type TZmDeletionObject = {
  id: string | number
  object: EntityType
  stamp: TUnixTime
  user: TUserId
}

export type TDeletionObject = Modify<TZmDeletionObject, { stamp: TMsTime }>
