import { TISOMonth } from 'shared/types'
import { useAppSelector } from 'store'
import { getEnvelopeGroups, TGroupInfo } from './getEnvelopeGroups'

export function useEnvelopeGroups(month: TISOMonth): TGroupInfo[] {
  return useAppSelector(getEnvelopeGroups)[month]
}
