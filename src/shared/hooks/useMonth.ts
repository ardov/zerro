import { useCallback } from 'react'
import { TDateDraft, TISOMonth } from '@shared/types'
import { isISOMonth, toISOMonth } from '@shared/helpers/date'
import { useSearchParam } from './useSearchParam'

export function useMonth(): [TISOMonth, (date: TDateDraft) => void] {
  const [urlMonth, setValue] = useSearchParam<TISOMonth>('month')
  const setMonth = useCallback(
    (date: TDateDraft = new Date()) => setValue(toISOMonth(date)),
    [setValue]
  )
  const month = isISOMonth(urlMonth) ? urlMonth : toISOMonth(new Date())
  return [month, setMonth]
}
