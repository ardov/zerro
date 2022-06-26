import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'
import { TDateDraft } from 'shared/types'

export function formatMoney(
  amount: number,
  shortCode?: string | null,
  decimals = 2
): string {
  try {
    return new Intl.NumberFormat('ru', {
      style: shortCode ? 'currency' : 'decimal',
      currency: shortCode || undefined,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  } catch (error) {
    return (
      new Intl.NumberFormat('ru', {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount) +
      ' ' +
      shortCode
    )
  }
}

export function getCurrencySymbol(currency: string): string {
  try {
    return Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
    })
      .format(0)
      .slice(5)
  } catch (error) {
    return currency
  }
}

/**
 * Formats date.
 * @link https://date-fns.org/v2.25.0/docs/format doc
 * @param date
 * @param template
 */
export function formatDate(date: TDateDraft, template?: string): string {
  const opts = { locale: ru }
  const d = new Date(date)
  if (template) return format(d, template, opts)
  if (isToday(d)) return format(d, 'Сегодня, d MMMM, EEEEEE', opts)
  if (isYesterday(d)) return format(d, 'Вчера, d MMMM, EEEEEE', opts)
  if (isThisYear(d)) return format(d, 'd MMMM, EEEEEE', opts)
  return format(d, 'd MMMM yyyy, EEEEEE', opts)
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
