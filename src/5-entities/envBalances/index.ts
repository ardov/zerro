import { useAppSelector } from 'store/index'
import { getMonthList } from './1 - monthList'
import { getRawActivity } from './1 - rawActivity'
import { getActivity } from './2 - activity'
import { getSortedActivity } from './2 - sortedActivity'
import { getEnvMetrics } from './3 - envMetrics'
import { getMonthTotals } from './4 - monthTotals'

export type { TRawActivityNode } from './1 - rawActivity'
export type { TActivityNode } from './2 - activity'
export type { TSortedActivityNode, TSortedActivity } from './2 - sortedActivity'
export type { TEnvMetrics } from './3 - envMetrics'
export type { TMonthTotals } from './4 - monthTotals'

export { EnvActivity } from './1 - rawActivity'
export { TrFilterMode } from './2 - sortedActivity'

export const balances = {
  // Selectors
  monthList: getMonthList,
  rawActivity: getRawActivity,
  activity: getActivity,
  sortedActivity: getSortedActivity,
  envData: getEnvMetrics,
  totals: getMonthTotals,

  // Hooks
  useMonthList: () => useAppSelector(getMonthList),
  useRawActivity: () => useAppSelector(getRawActivity),
  useActivity: () => useAppSelector(getActivity),
  useSortedActivity: () => useAppSelector(getSortedActivity),
  useEnvData: () => useAppSelector(getEnvMetrics),
  useTotals: () => useAppSelector(getMonthTotals),
}
