import { getBalances } from './getBalances'
import {
  getBalancesByDate,
  getDisplayBalancesByDate,
} from './getBalancesByDate'
import { useBalances, useDisplayBalances } from './useBalances'

export type { TBalanceNode, TBalanceState } from './shared/types'

export const accBalanceModel = {
  // Selectors. Reads are migrated to Core Next; these stay as the reference
  // implementation for parity tests.
  /** @deprecated Legacy reference; core builds balances via `buildBalances` */
  getBalances,
  /** @deprecated Read via `selectCoreBalancesByDate` from `core-next/adapters/redux` */
  getBalancesByDate,
  getDisplayBalancesByDate,

  // Hooks (already read core balances internally)
  useBalances,
  useDisplayBalances,
}
