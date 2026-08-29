import type { Locale } from 'date-fns'
import { format } from 'date-fns'
import type { TDateDraft, TISODate } from '6-shared/types'
import { getDateLocale } from './formatDate'
import { parseDate, toISODate } from './utils'

type TDateUnit = 'day' | 'month' | 'year'

/** The order the active locale writes a numeric date in, read off its own
 * short pattern rather than pinned per language: `dd.MM.y` is day, month,
 * year and `MM/dd/yyyy` is month, day, year. A locale added later needs no
 * entry anywhere for typing to keep working. */
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

/** The date as the locale writes it: `29.08.2026` in Russian, `29/08/2026`
 * in English. This is what the field shows and what it reads back. */
export function formatDateInput(
  date: TDateDraft,
  locale = getDateLocale()
): string {
  return format(parseDate(date), 'P', { locale })
}

/** The pattern spelled out for an empty field — `dd.mm.yyyy` rather than the
 * `dd.MM.y` the locale states it in, which is a format string and not
 * something to type. */
export function dateInputPlaceholder(locale = getDateLocale()): string {
  return shortPattern(locale).replace(/y+/g, 'yyyy').toLowerCase()
}

/** Where two digits stop being this century and start being the last one.
 * `strftime`'s split, and the right one for a ledger: it holds records older
 * than it holds plans, so `99` is 1999 rather than 2099 while `26` is still
 * this year. */
const CENTURY_PIVOT = 69

/** The year two digits stand for, or the number itself once there are more
 * of them. */
function expandYear(typed: string) {
  const year = Number(typed)
  if (typed.length > 2) return year
  return year < CENTURY_PIVOT ? 2000 + year : 1900 + year
}

/** What was typed, if it is a whole date.
 *
 * Deliberately looser than `date-fns` `parse`, which would reject `1.2.26`
 * for the pattern's two-digit day: the three numbers are read in the
 * locale's order whatever separates them, and two digits of year are a whole
 * year. A date the calendar cannot land on — the 31st of a 30-day month —
 * comes back as `null` rather than rolling over into the next one, which is
 * what constructing it would otherwise do.
 *
 * A `-` separates here as readily as a `/` does, so the sign in front of a
 * number is read as a separator and not as a sign. That is the cost of
 * accepting `3-9-2027`, and it is the cheaper half of the trade. */
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
  // A year of any other width is refused rather than reported. `toISODate`
  // writes the year unpadded, so `202` — which every keystroke of `2026`
  // passes through — would come back as `202-08-15`, a string no `parseISO`
  // can read and every `formatDate` throws on. There is no year here worth
  // reaching a transaction that way.
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
