import { useAppSelector } from '@store/index'
import { getMonthList } from './1 - monthList'
import { getRawActivity } from './1 - rawActivity'
import { getActivity } from './2 - activity'
import { getRatesByMonth } from './2 - rates'
import { getEnvMetrics } from './3 - envMetrics'
import { getMonthTotals } from './4 - monthTotals'

export type { TRawActivityNode } from './1 - rawActivity'
export type { TActivityNode } from './2 - activity'
export type { TEnvMetrics } from './3 - envMetrics'
export type { TMonthTotals } from './4 - monthTotals'

export const balances = {
  // Selectors
  monthList: getMonthList,
  rates: getRatesByMonth,
  rawActivity: getRawActivity,
  activity: getActivity,
  envData: getEnvMetrics,
  totals: getMonthTotals,
  // Hooks
  useMonthList: () => useAppSelector(getMonthList),
  useRates: () => useAppSelector(getRatesByMonth),
  useRawActivity: () => useAppSelector(getRawActivity),
  useActivity: () => useAppSelector(getActivity),
  useEnvData: () => useAppSelector(getEnvMetrics),
  useTotals: () => useAppSelector(getMonthTotals),
}
