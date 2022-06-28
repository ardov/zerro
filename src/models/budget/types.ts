import { TInstrumentId } from 'models/instrument'
import { TTagId } from 'models/tag'
import { TUserId } from 'models/user'
import {
  Modify,
  TISODate,
  TMilliUnits,
  TMsTime,
  TUnits,
  TUnixTime,
} from 'shared/types'

export type TBudgetId = `${TISODate}#${TTagId}`

export type TZmBudget = {
  changed: TUnixTime
  user: TUserId
  tag: TTagId | '00000000-0000-0000-0000-000000000000' | null
  date: TISODate
  income: TUnits
  incomeLock: boolean
  outcome: TUnits
  outcomeLock: boolean
}

export type TBudget = Modify<
  TZmBudget,
  {
    changed: TMsTime
    income: TMilliUnits
    outcome: TMilliUnits
  }
> & {
  id: TBudgetId
}

export type TPopulatedBudget = TBudget & {
  convertedOutcome: number
  instrument: TInstrumentId | null
}
