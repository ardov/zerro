import { useAppSelector } from 'store/index'
import { debtorGetter } from './debtorGetter'
import { getDebtors } from './getDebtors'

export type { TDebtor } from './getDebtors'

export const debtorModel = {
  // Selectors
  getDebtors,
  detector: debtorGetter,

  // Hooks
  useDebtors: () => useAppSelector(getDebtors),
}
