import { useMemo } from 'react'
import startOfMonth from 'date-fns/startOfMonth'
import parseDate from 'date-fns/parseISO'
import { format } from 'date-fns'
import { useParams, useHistory } from 'react-router'

export function useMonth() {
  const history = useHistory()
  const params = useParams()

  return useMemo(() => {
    const parsedMonth = +parseDate(params.month)
    const month =
      parsedMonth === +startOfMonth(parsedMonth) ? parsedMonth : null
    const setMonth = (date = new Date()) => {
      const month = format(new Date(date), 'yyyy-MM')
      history.push(`/budget/${month}`)
    }
    return [month, setMonth]
  }, [history, params.month])
}
