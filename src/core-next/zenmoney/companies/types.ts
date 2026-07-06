import type { TMsTime, TUnixTime } from '../primitives'

export type TCompanyId = number

export type TCompany = {
  id: TCompanyId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  title: string

  fullTitle: string | null

  www: string | null

  country: number | null

  countryCode: string | null

  /** Marks deleted or deprecated reference entries from ZenMoney sync. */
  deleted: boolean
}

export type TZmCompany = Omit<TCompany, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}
