import { useMemo } from 'react'
import { useHistory, useLocation } from 'react-router'
import { TDateDraft, TISOMonth } from 'shared/types'
import { isISOMonth, toISOMonth } from 'shared/helpers/date'

export function useMonth(): [TISOMonth, (date: TDateDraft) => void] {
  const history = useHistory()
  const location = useLocation()
  const setMonth = useMemo(() => {
    return (date: TDateDraft = new Date()) => {
      history.push(getModifiedPath('month', toISOMonth(date)))
    }
  }, [history])
  const urlMonth = new URLSearchParams(location.search).get('month')
  const month = isISOMonth(urlMonth) ? urlMonth : toISOMonth(new Date())
  return [month, setMonth]
}

function getModifiedPath(key: string, value?: string | null) {
  const url = new URL(window.location.href)
  url.searchParams.delete(key)
  if (value) url.searchParams.append(key, value)
  const path = url.pathname + url.search
  return path
}
