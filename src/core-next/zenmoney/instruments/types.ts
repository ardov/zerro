/** Numeric ZenMoney instrument id. Accounts and transactions reference this. */
export type TInstrumentId = number

/** Currency-code-like value, for example USD or EUR. */
export type TFxCode = string

export type TZmInstrument = {
  /** Numeric ZenMoney instrument id. */
  id: TInstrumentId

  /** Last ZenMoney change timestamp in seconds before normalization. */
  changed: number

  /** Human-readable instrument name from ZenMoney. */
  title: string

  /** Currency-code-like value used by core read models as `TFxCode`. */
  shortTitle: TFxCode

  /** Display symbol from ZenMoney, for example `$` or `€`. */
  symbol: string

  /** Current ZenMoney exchange rate value. Historical rates live elsewhere. */
  rate: number
}

export type TInstrument = TZmInstrument & {
  /** Normalized last change timestamp in milliseconds. */
  changed: number
}
