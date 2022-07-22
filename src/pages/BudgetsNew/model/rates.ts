import { getComputedTotals } from 'models/envelopes'
import { TISOMonth, TRates } from 'shared/types'
import { useAppSelector } from 'store'

export function useRates(month: TISOMonth): TRates {
  return useAppSelector(getComputedTotals)[month].rates
}
