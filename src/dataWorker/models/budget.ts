import { Modify } from 'types'
import {
  isoToUnix,
  milliunitsToUnits,
  TISODate,
  TISOTimestamp,
  TMilliUnits,
  TUnits,
  TUnixTime,
  unitsToMilliunits,
  unixToISO,
} from './common'
import { TTagId } from './tag'
import { TUserId } from './user'

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
    // Converted
    changed: TISOTimestamp
    // date: TISODate
    income: TMilliUnits
    outcome: TMilliUnits
  }
>

// Converter
export const convertBudget = {
  toClient: (el: TZmBudget): TBudget => ({
    ...el,
    changed: unixToISO(el.changed),
    income: unitsToMilliunits(el.income),
    outcome: unitsToMilliunits(el.outcome),
  }),
  toServer: (el: TBudget): TZmBudget => ({
    ...el,
    changed: isoToUnix(el.changed),
    income: milliunitsToUnits(el.income),
    outcome: milliunitsToUnits(el.outcome),
  }),
}
