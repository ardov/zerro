import type { TMsTime, TUnixTime } from '../primitives'

export type TInstrumentId = number

/** Currency-code-like value, for example USD or EUR. */
export type TFxCode = string

export type TInstrument = {
  id: TInstrumentId

  /** Normalized timestamp in milliseconds. ZenMoney wire data uses seconds. */
  changed: TMsTime

  title: string

  /** Currency-code-like value. E.g., 'USD', 'EUR', 'RUB'. */
  shortTitle: TFxCode

  symbol: string

  /** Current ZenMoney exchange rate value. Historical rates live elsewhere. */
  rate: number
}

export type TZmInstrument = Omit<TInstrument, 'changed'> & {
  /** ZenMoney wire timestamp in seconds. */
  changed: TUnixTime
}
