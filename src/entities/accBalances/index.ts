import { getBalances } from './getBalances'
import {
  getBalancesByDate,
  getDisplayBalancesByDate,
} from './getBalancesByDate'
import { useBalances, useDisplayBalances } from './useBalances'

export const accBalanceModel = {
  // Selectors
  getBalances,
  getBalancesByDate,
  getDisplayBalancesByDate,

  // Hooks
  useBalances,
  useDisplayBalances,
}
