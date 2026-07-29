import { ToolError, type TRatesMeta } from './output'

export type TFxVector = Record<string, number>
export type TRates = Record<string, number>

/**
 * The full instrument table carries ZenMoney's entire global currency
 * catalog (100+ codes), not just the ones this user's data touches.
 * Restrict `values` to currencies actually referenced by an account, plus
 * the base currency, so `meta` doesn't balloon with currencies never seen
 * in any amount vector.
 */
export function buildRatesMeta(
  instruments: Record<number, { shortTitle: string; rate: number }>,
  usedInstrumentIds: ReadonlySet<number>
): TRatesMeta {
  const values: TRates = {}
  let base = 'RUB'
  Object.entries(instruments).forEach(([id, instrument]) => {
    if (instrument.rate === 1) base = instrument.shortTitle
    if (usedInstrumentIds.has(Number(id)) || instrument.rate === 1)
      values[instrument.shortTitle] = instrument.rate
  })
  return { base, values }
}

/**
 * Unlike buildRatesMeta, this keeps every known currency code so
 * --display-currency can convert into any real-world currency ZenMoney has
 * a rate for, not only the ones this user's accounts happen to hold.
 */
export function buildFullRates(
  instruments: Record<number, { shortTitle: string; rate: number }>
): TRates {
  const rates: TRates = {}
  Object.values(instruments).forEach(instrument => {
    rates[instrument.shortTitle] = instrument.rate
  })
  return rates
}

export function requireRateCode(
  rates: TRates,
  code: string,
  command: string,
  option: string
): void {
  if (!(code in rates))
    throw new ToolError(
      command,
      'none',
      'INVALID_INPUT',
      `${option} must be a known currency code`,
      2,
      { code }
    )
}

export function convertFx(
  amount: TFxVector,
  targetCode: string,
  rates: TRates
): number {
  const targetRate = rates[targetCode]
  if (!targetRate) return 0
  let result = 0
  for (const [code, value] of Object.entries(amount)) {
    const rate = rates[code]
    if (rate === undefined) continue
    result = round(result + (value * rate) / targetRate)
  }
  return result
}

function round(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function convertAmounts<K extends string>(
  amounts: Record<K, TFxVector>,
  targetCode: string,
  rates: TRates
): Record<K, number> {
  const result = {} as Record<K, number>
  ;(Object.keys(amounts) as K[]).forEach(key => {
    result[key] = convertFx(amounts[key], targetCode, rates)
  })
  return result
}

/**
 * Reads --display-currency (case-insensitively) and validates it against
 * every currency code ZenMoney knows a rate for. Takes the raw instrument
 * table rather than a workspace so this stays free of any dependency on
 * the state-file layer.
 */
export function resolveDisplayCurrency(
  options: Record<string, string | undefined>,
  instruments: Record<number, { shortTitle: string; rate: number }>,
  command: string
): string | undefined {
  const raw = options['display-currency']
  if (!raw) return undefined
  const code = raw.toUpperCase()
  const rates = buildFullRates(instruments)
  requireRateCode(rates, code, command, '--display-currency')
  return code
}
