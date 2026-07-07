import type { TMsTime, TUnixTime } from '../primitives'
import type { TUserId } from '../users'

export type TTagId = string
export type TIconName = string

export type TTag = {
  id: TTagId

  /** Root user ID. */
  user: TUserId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  /** Icon name. */
  icon: TIconName | null
  budgetIncome: boolean
  budgetOutcome: boolean
  /** Whether the tag is archived. */
  archive: boolean | null
  /** Whether the tag is shown in a list of income tags. */
  showIncome: boolean
  /** Whether the tag is shown in a list of outcome tags. */
  showOutcome: boolean
  title: string
  parent: TTagId | null
  color: number | null

  /** Used to be used in ZenMoney analytics */
  required: boolean | null
  /** Deprecated field */
  staticId: string | null
  /** Deprecated field */
  picture: string | null
}

export type TZmTag = Omit<TTag, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}
