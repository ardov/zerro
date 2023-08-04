import {
  startOfWeek as startOfWeekFNS,
  differenceInCalendarMonths as differenceInCalendarMonthsFNS,
  eachDayOfInterval as eachDayOfIntervalFNS,
  parseISO,
  isToday,
  format,
  isYesterday,
  isThisYear,
} from 'date-fns'
import ru from 'date-fns/locale/ru'
import {
  TDateDraft,
  TISODate,
  TISOMonth,
  TMsTime,
  TUnixTime,
} from '6-shared/types'

export function unixToMs(seconds: TUnixTime): TMsTime {
  return seconds * 1000
}
export function msToUnix(date: TMsTime): TUnixTime {
  return Math.round(date / 1000)
}

export function parseDate(date: TDateDraft): Date {
  if (typeof date === 'string') return parseISO(date)
  return new Date(date)
}

export function differenceInCalendarMonths(
  date1: TDateDraft,
  date2: TDateDraft
): number {
  return differenceInCalendarMonthsFNS(parseDate(date1), parseDate(date2))
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

export function startOfMonth(d: TDateDraft) {
  const date = parseDate(d)
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(d: TDateDraft) {
  const date = parseDate(d)
  const nextMonthStart = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return new Date(+nextMonthStart - 1)
}

export function getMonthLength(d: TDateDraft) {
  return endOfMonth(d).getDate()
}

export function startOfDay(d: TDateDraft) {
  const date = parseDate(d)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function endOfDay(d: TDateDraft) {
  const date = parseDate(d)
  const nextDayStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1
  )
  return new Date(+nextDayStart - 1)
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

export function startOfWeek(d: TDateDraft) {
  const date = parseDate(d)
  return startOfWeekFNS(date, { weekStartsOn: 1 })
}

export function eachDayOfInterval(start: TDateDraft, end: TDateDraft) {
  return eachDayOfIntervalFNS({
    start: parseDate(start),
    end: parseDate(end),
  })
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

/**
 * Formats date.
 * @link https://date-fns.org/v2.25.0/docs/format doc
 * @param date
 * @param template
 */
export function formatDate(date: TDateDraft, template?: string): string {
  const opts = { locale: ru }
  const d = parseDate(date)
  if (template) return format(d, template, opts)
  if (isToday(d)) return format(d, 'Сегодня, d MMMM, EEEEEE', opts)
  if (isYesterday(d)) return format(d, 'Вчера, d MMMM, EEEEEE', opts)
  if (isThisYear(d)) return format(d, 'd MMMM, EEEEEE', opts)
  return format(d, 'd MMMM yyyy, EEEEEE', opts)
}
