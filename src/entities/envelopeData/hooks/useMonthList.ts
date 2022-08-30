import { TISOMonth } from '@shared/types'
import { useAppSelector } from '@store'
import { getMonthList } from '../parts/monthList'

export function useMonthList(): TISOMonth[] {
  return useAppSelector(getMonthList)
}
