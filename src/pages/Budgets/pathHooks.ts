import { useMemo } from 'react'
import { useHistory, useLocation } from 'react-router'
import { TDateDraft, TISOMonth } from 'shared/types'
import { toISOMonth } from 'shared/helpers/adapterUtils'

function getModifiedPath(key: string, value?: string | null) {
  const url = new URL(window.location.href)
  url.searchParams.delete(key)
  if (value) url.searchParams.append(key, value)
  const path = url.pathname + url.search
  return path
}

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

/**
 * Function checks if string is valid ISO month
 */
export function isISOMonth(month?: string | null): month is TISOMonth {
  if (!month) return false
  const regex = /\d{4}-\d{2}/g // 0000-00
  return regex.test(month)
}
