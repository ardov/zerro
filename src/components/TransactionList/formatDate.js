import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'

export default function formatDate(date) {
  const formats = {
    today: 'Сегодня, d MMMM, EEEEEE',
    yesterday: 'Вчера, d MMMM, EEEEEE',
    thisYear: 'd MMMM, EEEEEE',
    previousYear: 'd MMMM yyyy, EEEEEE',
  }
  const formatString = isToday(date)
    ? formats.today
    : isYesterday(date)
    ? formats.yesterday
    : isThisYear(date)
    ? formats.thisYear
    : formats.previousYear
  return format(date, formatString, { locale: ru })
}
