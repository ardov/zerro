import { UserId } from './User'
import { TagId } from './Tag'
import { Modify } from '../ts-utils'
import { TISODate, TMilliUnits, TUnits, TUnixTime } from './common'

export type ZmBudget = {
  changed: TUnixTime
  user: UserId
  tag: TagId | '00000000-0000-0000-0000-000000000000' | null
  date: TISODate
  income: TUnits
  incomeLock: boolean
  outcome: TUnits
  outcomeLock: boolean
}

export type TBudget = Modify<
  ZmBudget,
  {
    // Converted
    changed: TISOTimestamp
    // date: TISODate
    income: TMilliUnits
    outcome: TMilliUnits
  }
>
