import { format, isToday, isYesterday, isThisYear } from 'date-fns'
import ru from 'date-fns/locale/ru'

export default function formatDate(date) {
  const formats = {
    today: 'Сегодня, D MMMM, dd',
    yesterday: 'Вчера, D MMMM, dd',
    thisYear: 'D MMMM, dd',
    previousYear: 'D MMMM YYYY, dd',
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
