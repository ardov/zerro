import {
  isToday,
  format,
  formatDistanceToNow,
  isYesterday,
  isThisYear,
} from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { enGB as en } from 'date-fns/locale/en-GB'
import type { TDateDraft } from '@/6-shared/types'
import { t } from 'i18next'
import { parseDate } from './utils'
import { i18n } from '@/6-shared/localization'

/**
 * Formats date.
 * @link https://date-fns.org/v2.25.0/docs/format doc
 * @param date
 * @param template
 */
const DAY = 24 * 60 * 60 * 1000

/**
 * "5 minutes ago" while that is the useful answer, an absolute date once it
 * stops being one.
 *
 * A change made seconds ago reads badly as a wall-clock timestamp: the user
 * knows *when* they did it and wants to know *how long ago*. Past a day the
 * relation stops helping and the date itself is what identifies the point.
 */
export function formatTimeAgo(date: TDateDraft): string {
  const d = parseDate(date)
  const elapsed = Date.now() - d.getTime()
  if (elapsed < 0 || elapsed >= DAY)
    return formatDate(date, 'd MMM yyyy, HH:mm')
  return formatDistanceToNow(d, { addSuffix: true, locale: getDateLocale() })
}

/** The `date-fns` locale the interface is currently in. Read at call time
 * rather than held, so a language change is one re-render away — the calendar
 * reads it the same way this file's own formatting does. */
export function getDateLocale() {
  return (i18n.resolvedLanguage || i18n.language) === 'ru' ? ru : en
}

export function formatDate(date: TDateDraft, template?: string): string {
  const opts = { locale: getDateLocale() }
  const d = parseDate(date)
  if (template) return format(d, template, opts)
  const thisYearDate = format(d, `d MMMM, EEEEEE`, opts)
  if (isToday(d)) return `${t('common:today')}, ${thisYearDate}`
  if (isYesterday(d)) return `${t('common:yesterday')}, ${thisYearDate}`
  if (isThisYear(d)) return thisYearDate
  return format(d, 'd MMMM yyyy, EEEEEE', opts)
}
