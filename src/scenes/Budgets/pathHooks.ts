import { useMemo } from 'react'
import startOfMonth from 'date-fns/startOfMonth'
import parseDate from 'date-fns/parseISO'
import { useHistory, useLocation } from 'react-router'
import { formatDate } from 'helpers/format'

function getModifiedPath(key: string, value?: string | null) {
  const url = new URL(window.location.href)
  url.searchParams.delete(key)
  if (value) url.searchParams.append(key, value)
  const path = url.pathname + url.search
  return path
}

export function useMonth(): [number, (date: string | number | Date) => void] {
  const history = useHistory()
  const location = useLocation()
  const setMonth = useMemo(() => {
    return (date: string | number | Date = new Date()) => {
      const month = formatDate(new Date(date), 'yyyy-MM')
      history.push(getModifiedPath('month', month))
    }
  }, [history])
  const urlMonth = new URLSearchParams(location.search).get('month')
  const monthRegex = /\d{4}-\d{2}/g // 0000-00
  const month = urlMonth?.match(monthRegex)
    ? +parseDate(urlMonth)
    : +startOfMonth(new Date())
  return [month, setMonth]
}

export function useDrawerId(): [
  string | null,
  (id?: string | 'overview' | null) => void
] {
  const history = useHistory()
  const location = useLocation()
  const drawer = new URLSearchParams(location.search).get('drawer')
  const setDrawer = useMemo(() => {
    return (id?: string | 'overview' | null) => {
      history.push(getModifiedPath('drawer', id))
    }
  }, [history])
  return [drawer, setDrawer]
}
