import { TISOMonth } from '@shared/types'
import { useAppSelector } from '@store'
import { getMonthTotals, TMonthTotals } from '../getMonthTotals'

export function useMonthTotals(month: TISOMonth): TMonthTotals {
  return useAppSelector(getMonthTotals)[month]
}
