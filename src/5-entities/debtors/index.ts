import { debtorGetter } from './debtorGetter'
import { getDebtors } from './getDebtors'

export type { TDebtor } from './getDebtors'

export const debtorModel = {
  // Selectors. Reads are migrated to Core Next; these stay as the reference
  // implementation for parity tests and legacy chain internals.
  /** @deprecated Read via `selectCoreDebtors` from `core-next/adapters/redux` */
  getDebtors,
  detector: debtorGetter,
}
