import { isToday, format, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'
import en from 'date-fns/locale/en-GB'
import { TDateDraft } from '6-shared/types'
import { t } from 'i18next'
import { parseDate } from './utils'
import { i18n } from '6-shared/localization'

/**
 * Formats date.
 * @link https://date-fns.org/v2.25.0/docs/format doc
 * @param date
 * @param template
 */
export function formatDate(date: TDateDraft, template?: string): string {
  // TODO: need more elegant solution 😬
  const locale = (i18n.resolvedLanguage || i18n.language) === 'ru' ? ru : en
  const opts = { locale }
  const d = parseDate(date)
  if (template) return format(d, template, opts)
  const thisYearDate = format(d, `d MMMM, EEEEEE`, opts)
  if (isToday(d)) return `${t('common:today')}, ${thisYearDate}`
  if (isYesterday(d)) return `${t('common:yesterday')}, ${thisYearDate}`
  if (isThisYear(d)) return thisYearDate
  return format(d, 'd MMMM yyyy, EEEEEE', opts)
}
