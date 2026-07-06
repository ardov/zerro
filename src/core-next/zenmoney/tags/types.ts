import tagIcons from '6-shared/tagIcons.json'
import type { TMsTime, TUnixTime } from '../primitives'
import type { TUserId } from '../users'

export type TTagId = string
export type TIconName = keyof typeof tagIcons

export type TTag = {
  id: TTagId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  user: TUserId
  title: string
  parent: TTagId | null
  icon: TIconName | null
  staticId: string | null
  picture: string | null
  color: number | null
  showIncome: boolean
  showOutcome: boolean
  budgetIncome: boolean
  budgetOutcome: boolean
  required: boolean | null
}

export type TZmTag = Omit<TTag, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}
