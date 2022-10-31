import { useCallback } from 'react'
import { convertFx } from '@shared/helpers/money'
import { TFxAmount, TISOMonth } from '@shared/types'
import { useDisplayCurrency } from '@entities/displayCurrency'
import { useRates } from './useRates'

export function useDisplayValue(month: TISOMonth): (a: TFxAmount) => number {
  const [currency] = useDisplayCurrency()
  const rates = useRates(month)
  const fn = useCallback(
    (a: TFxAmount) => convertFx(a, currency, rates),
    [currency, rates]
  )
  return fn
}
