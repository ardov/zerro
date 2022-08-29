import { TISOMonth, TRates } from '@shared/types'
import { useAppSelector } from '@store'
import { getMonthTotals } from '../getMonthTotals'

export function useRates(month: TISOMonth): TRates {
  return useAppSelector(getMonthTotals)[month].rates
}
