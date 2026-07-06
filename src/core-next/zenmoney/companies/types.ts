/** Numeric ZenMoney company id. Bank ids on transactions reference this. */
export type TCompanyId = number

export type TZmCompany = {
  /** Numeric ZenMoney company id. */
  id: TCompanyId

  /** Last ZenMoney change timestamp in seconds before normalization. */
  changed: number

  /** Short display name from ZenMoney. */
  title: string

  /** Full legal or provider name when ZenMoney has one. */
  fullTitle: string | null

  /** Company website from ZenMoney reference data. */
  www: string | null

  /** Numeric ZenMoney country id. */
  country: number | null

  /** Country code from ZenMoney reference data. */
  countryCode: string | null

  /** Marks deleted or deprecated reference entries from ZenMoney sync. */
  deleted: boolean
}

export type TCompany = TZmCompany & {
  /** Normalized last change timestamp in milliseconds. */
  changed: number
}
