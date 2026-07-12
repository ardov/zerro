import type { TISODate, TMsTime, TUnixTime, TUnits } from '../primitives'
import type { TTagId } from '../tags'
import type { TUserId } from '../users'

export type TBudgetId = `${TISODate}#${TTagId}`

export const globalBudgetTagId = '00000000-0000-0000-0000-000000000000'

export type TGlobalBudgetTagId = typeof globalBudgetTagId

export type TBudgetTagId = TTagId | TGlobalBudgetTagId | null

export type TBudget = {
  /** Client-only normalized id built from date and tag. */
  id: TBudgetId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  user: TUserId
  tag: TBudgetTagId
  date: TISODate
  income: TUnits
  incomeLock: boolean
  outcome: TUnits
  outcomeLock: boolean
}

export type TZmBudget = Omit<TBudget, 'id' | 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}
