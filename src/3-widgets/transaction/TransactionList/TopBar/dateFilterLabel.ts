import {
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isLastDayOfMonth,
  subDays,
} from 'date-fns'
import type { useTranslation } from 'react-i18next'
import { getDateLocale, parseDate } from '@/6-shared/helpers/date'
import type { DateClause } from './filterModel'

/** Compact calendar dates; only bounded single days get relative names. */
export function getDateFilterLabel(
  clause: DateClause,
  t: ReturnType<typeof useTranslation>['t'],
  language: string,
  now = new Date()
): string {
  const from = clause.from ? parseDate(clause.from) : null
  const to = clause.to ? parseDate(clause.to) : null
  const print = (date: Date, pattern: string) =>
    format(date, pattern, { locale: getDateLocale(language) })
  const day = (date: Date) =>
    print(date, isSameYear(date, now) ? 'd MMM' : 'd MMM yyyy')
  if (!from && !to) return t('date')
  if (!from) return t('dateThrough', { date: day(to!) })
  if (!to) return t('dateSince', { date: day(from) })
  if (isSameDay(from, to)) {
    if (isSameDay(from, now)) return t('common:today')
    if (isSameDay(from, subDays(now, 1))) return t('common:yesterday')
    return day(from)
  }
  if (!isSameYear(from, to))
    return `${print(from, 'd MMM yyyy')} – ${print(to, 'd MMM yyyy')}`
  const year = isSameYear(from, now) ? '' : ` ${print(from, 'yyyy')}`
  if (isSameMonth(from, to)) {
    if (from.getDate() === 1 && isLastDayOfMonth(to))
      return `${print(from, 'LLL')}${year}`
    return `${print(from, 'd')}–${print(to, 'd MMM')}${year}`
  }
  return `${print(from, 'd MMM')} – ${print(to, 'd MMM')}${year}`
}
