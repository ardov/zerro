import { TEnvelopeId, TISOMonth } from '@shared/types'
import { useAppSelector } from '@store'
import { getMonthTotals } from '../getMonthTotals'

export function useEnvelope(month: TISOMonth, id: TEnvelopeId) {
  return useAppSelector(getMonthTotals)[month].envelopes[id]
}
