import { useCallback } from 'react'
import type { TDateDraft } from '../../zenmoney/primitives'
import type { TFxAmount } from '../../shared/money'
import { useAppSelector } from 'store'
import { selectCoreDisplayConverter } from './selectors'

export function useCoreToDisplay(defaultDate: TDateDraft | 'current') {
  const convert = useAppSelector(selectCoreDisplayConverter)
  return useCallback(
    (amount: TFxAmount, date: TDateDraft | 'current' = defaultDate) =>
      convert(amount, date),
    [convert, defaultDate]
  )
}
