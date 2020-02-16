import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'

export default function formatDate(date) {
  const opts = { locale: ru }

  if (isToday(date)) return format(date, 'Сегодня, d MMMM, EEEEEE', opts)
  if (isYesterday(date)) return format(date, 'Вчера, d MMMM, EEEEEE', opts)
  if (isThisYear(date)) return format(date, 'd MMMM, EEEEEE', opts)
  return format(date, 'd MMMM yyyy, EEEEEE', opts)
}
