// Internal date utilities. Not part of the public Core Next API.
// Dependency-free: keep it that way so the future package has zero runtime deps.
import type { TDateDraft, TISODate, TISOMonth } from '../zenmoney/primitives'

const ISO_DATE_OR_MONTH = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/

export function parseDate(date: TDateDraft): Date {
  if (typeof date === 'string') {
    // Date-only ISO strings must parse as LOCAL midnight (date-fns parseISO
    // semantics); native `new Date('2000-01-01')` would treat them as UTC.
    const m = ISO_DATE_OR_MONTH.exec(date)
    if (m) return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1)
    return new Date(date)
  }
  return new Date(date)
}

export function differenceInCalendarMonths(
  date1: TDateDraft,
  date2: TDateDraft
): number {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  return (
    (d1.getFullYear() - d2.getFullYear()) * 12 + (d1.getMonth() - d2.getMonth())
  )
}

export function toISODate(date: TDateDraft): TISODate {
  if (isISODate(date)) return date
  if (isISOMonth(date)) return (date + '-01') as TISODate
  const d = parseDate(date)
  const yyyy = d.getFullYear()
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  return `${yyyy}-${mm}-${dd}` as TISODate
}

export function toISOMonth(date: TDateDraft): TISOMonth {
  if (isISOMonth(date)) return date
  const d = parseDate(date)
  const yyyy = d.getFullYear()
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${yyyy}-${mm}` as TISOMonth
}

export function prevMonth(d: TDateDraft) {
  const date = parseDate(d)
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
}

export function nextDay(d: TDateDraft) {
  const date = parseDate(d)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
}

export function nextMonth(d: TDateDraft) {
  const date = parseDate(d)
  return new Date(date.getFullYear(), date.getMonth() + 1, 1)
}

export function nextYear(d: TDateDraft) {
  const date = parseDate(d)
  return new Date(date.getFullYear() + 1, 0, 1)
}

/** Checks if string is valid ISO month */
export function isISOMonth(date?: any): date is TISOMonth {
  if (!date) return false
  if (typeof date !== 'string') return false
  const regex = /\d{4}-\d{2}/g // 0000-00
  return regex.test(date) && date.length === 7
}

/** Checks if string is valid ISO date */
export function isISODate(date?: any): date is TISODate {
  if (!date) return false
  if (typeof date !== 'string') return false
  const regex = /\d{4}-\d{2}-\d{2}/g // 0000-00-00
  return regex.test(date) && date.length === 10
}

export enum GroupBy {
  Day = 'day',
  Month = 'month',
  Year = 'year',
}

export function toGroup(date: TDateDraft, aggregation: GroupBy): TISODate {
  const isoDate = toISODate(date)
  switch (aggregation) {
    case GroupBy.Year:
      return (isoDate.slice(0, 4) + '-01-01') as TISODate
    case GroupBy.Month:
      return (isoDate.slice(0, 7) + '-01') as TISODate
    case GroupBy.Day:
      return isoDate
    default:
      throw new Error(`Unknown aggregation: ${aggregation}`)
  }
}

export function nextGroup(date: TDateDraft, aggregation: GroupBy): TISODate {
  const currGroup = toGroup(date, aggregation)
  switch (aggregation) {
    case GroupBy.Year:
      return toISODate(nextYear(currGroup))
    case GroupBy.Month:
      return toISODate(nextMonth(currGroup))
    case GroupBy.Day:
      return toISODate(nextDay(currGroup))
    default:
      throw new Error(`Unknown aggregation: ${aggregation}`)
  }
}

export function makeDateArray(
  from: TDateDraft,
  to: TDateDraft = new Date(),
  aggregation: GroupBy = GroupBy.Month
): Array<TISODate> {
  let current = toGroup(from, aggregation)
  let last = toGroup(to, aggregation)
  const months = [current]
  while (current < last) {
    current = nextGroup(current, aggregation)
    months.push(current)
  }
  return months
}
