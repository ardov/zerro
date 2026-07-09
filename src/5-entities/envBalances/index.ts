import { getMonthList } from './1 - monthList'
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

// Selectors. Reads are migrated to Core Next; these stay as the reference
// implementation for parity tests, fixture exports, and the not-yet-migrated
// write thunks.
export const balances = {
  /** @deprecated Read via `selectCoreMonthList` from `core-next/adapters/redux` */
  monthList: getMonthList,
  /** @deprecated Read via `selectCoreActivity` from `core-next/adapters/redux` */
  activity: getActivity,
  /** @deprecated Read via `selectCoreSortedActivity` from `core-next/adapters/redux` */
  sortedActivity: getSortedActivity,
  /** @deprecated Read via `selectCoreEnvMetrics` from `core-next/adapters/redux` */
  envData: getEnvMetrics,
  /** @deprecated Read via `selectCoreMonthTotals` from `core-next/adapters/redux` */
  totals: getMonthTotals,
}
