import { TFxCode } from 'shared/types'
import currencySymbols from './currencySymbols.json'

const currencyInfo = currencySymbols as Record<
  TFxCode,
  { name: string; symbol?: string }
>
const thousandSeparator = ' '
const decimalSeparator = ','

/**
 * Formats number using thousand separator and decimal separator.
 * @param number - Number to format.
 * @param currency - currency code.
 * @param decimals - Number of decimals to show
 */
export function formatMoney(
  number: number,
  currency?: TFxCode | null,
  decimals = 2
): string {
  const parts = number.toFixed(decimals).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)
  const value = parts.join(decimalSeparator)
  if (currency) {
    return value + ' ' + getCurrencySymbol(currency)
    // return getCurrencySymbol(currency) + ' ' + value
  }
  return value
}

/**
 * Formats number using thousand separator and decimal separator.
 * @param number - Number to format.
 * @param currency - currency code.
 * @param decimals - Number of decimals to show
 */
export function getFormattedParts(
  number: number,
  currency?: TFxCode | null,
  decimals = 2
) {
  const parts = Math.abs(number).toFixed(decimals).split('.')
  return {
    original: number,
    sign: number < 0 ? '-' : number > 0 ? '+' : '',
    value: parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator),
    decimals: parts[1],
    decimalSeparator,
    currency: currency ? getCurrencySymbol(currency) : '',
  }
}

export function getCurrencySymbol(code: TFxCode): string {
  return currencyInfo[code]?.symbol || code
}

export function rateToWords(
  sum1 = 0,
  currency1: string,
  sum2 = 0,
  currency2: string
): string {
  if (!sum1 || !sum2) return ''
  if (sum1 < sum2) {
    return `${formatMoney(1, currency1, 0)} = ${formatMoney(
      sum2 / sum1,
      currency2
    )}`
  } else {
    return `${formatMoney(1, currency2, 0)} = ${formatMoney(
      sum1 / sum2,
      currency1
    )}`
  }
}
