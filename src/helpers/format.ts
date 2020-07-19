import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'

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
  return Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  })
    .format(0)
    .slice(5)
}

export function formatDate(date: number | Date, template?: string): string {
  const opts = { locale: ru }
  if (template) return format(date, template, opts)
  if (isToday(date)) return format(date, 'Сегодня, d MMMM, EEEEEE', opts)
  if (isYesterday(date)) return format(date, 'Вчера, d MMMM, EEEEEE', opts)
  if (isThisYear(date)) return format(date, 'd MMMM, EEEEEE', opts)
  return format(date, 'd MMMM yyyy, EEEEEE', opts)
}
