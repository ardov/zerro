import type { Locale } from 'date-fns'
import { format } from 'date-fns'
import type { TDateDraft, TISODate } from '@/6-shared/types'
import { getDateLocale } from './formatDate'
import { parseDate, toISODate } from './utils'

type TDateUnit = 'day' | 'month' | 'year'

/** Derive field order from the locale's short pattern so adding a locale needs no lookup table. */
function unitOrder(locale: Locale): TDateUnit[] {
  const order: TDateUnit[] = []
  for (const char of shortPattern(locale)) {
    const unit =
      char === 'd' ? 'day' : char === 'M' ? 'month' : char === 'y' ? 'year' : ''
    if (unit && !order.includes(unit)) order.push(unit)
  }
  return order
}

function shortPattern(locale: Locale) {
  return locale.formatLong.date({ width: 'short' })
}

export function formatDateInput(
  date: TDateDraft,
  locale = getDateLocale()
): string {
  return format(parseDate(date), 'P', { locale })
}

export function dateInputPlaceholder(locale = getDateLocale()): string {
  return shortPattern(locale).replace(/y+/g, 'yyyy').toLowerCase()
}

/** Use strftime's two-digit-year pivot so older ledger records can land in the 1900s. */
const CENTURY_PIVOT = 69

function expandYear(typed: string) {
  const year = Number(typed)
  if (typed.length > 2) return year
  return year < CENTURY_PIVOT ? 2000 + year : 1900 + year
}

/** Read numbers in locale order with any separator; reject calendar rollover instead of silently changing the date. */
export function parseDateInput(
  text: string,
  locale = getDateLocale()
): TISODate | null {
  const numbers = text.match(/\d+/g)
  const order = unitOrder(locale)
  if (!numbers || numbers.length !== 3 || order.length !== 3) return null
  const typed = {} as Record<TDateUnit, string>
  order.forEach((unit, i) => (typed[unit] = numbers[i]))
  const year = expandYear(typed.year)
  // toISODate does not pad partial years, so years other than two or four digits would break parseISO.
  if (year < 1000 || year > 9999) return null
  const month = Number(typed.month)
  const day = Number(typed.day)
  const date = new Date(year, month - 1, day)
  // Two-digit years land in the 1900s through the constructor, and the
  // round trip below would then reject every one of them.
  date.setFullYear(year)
  const rolledOver =
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  return rolledOver ? null : toISODate(date)
}
