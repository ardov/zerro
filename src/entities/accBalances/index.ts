import { getBalances } from './getBalances'
import {
  getBalancesByDate,
  getBalancesByDateFull,
  getDisplayBalancesByDate,
} from './getBalancesByDate'
import { useBalances, useDisplayBalances } from './useBalances'

export const accBalanceModel = {
  // Selectors
  getBalances,
  getBalancesByDate,
  getBalancesByDateFull,
  getDisplayBalancesByDate,

  // Hooks
  useBalances,
  useDisplayBalances,
}
