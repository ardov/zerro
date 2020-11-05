import { useMemo } from 'react'
import startOfMonth from 'date-fns/startOfMonth'
import parseDate from 'date-fns/parseISO'
import { format } from 'date-fns'
import { useParams, useHistory } from 'react-router'

interface Params {
  month?: string
}

export function useMonth(): [
  number | null,
  (date: string | number | Date) => void
] {
  const history = useHistory()
  const params = useParams<Params>()

  return useMemo(() => {
    const parsedMonth = +parseDate(params.month || '')
    const month =
      parsedMonth === +startOfMonth(parsedMonth) ? parsedMonth : null
    const setMonth = (date: string | number | Date = new Date()) => {
      const month = format(new Date(date), 'yyyy-MM')
      history.push(`/budget/${month}`)
    }
    return [month, setMonth]
  }, [history, params.month])
}
