import { useAppSelector } from 'store/index'
import {
  getAccountList,
  getAccounts,
  getDebtAccountId,
  getInBudgetAccounts,
  getPopulatedAccounts,
  getSavingAccounts,
} from './selectors'
import { makeAccount } from './shared/makeAccount'

export type { TAccountDraft } from './shared/makeAccount'
export type { TAccountPopulated } from './shared/populate'

export const accountModel = {
  getAccounts,
  getDebtAccountId,
  getPopulatedAccounts,
  getAccountList,
  getInBudgetAccounts,
  getSavingAccounts,
  // Hooks
  useAccounts: () => useAppSelector(getAccounts),
  useDebtAccountId: () => useAppSelector(getDebtAccountId),
  usePopulatedAccounts: () => useAppSelector(getPopulatedAccounts),
  useAccountList: () => useAppSelector(getAccountList),
  useInBudgetAccounts: () => useAppSelector(getInBudgetAccounts),
  useSavingAccounts: () => useAppSelector(getSavingAccounts),
  // Actions
  makeAccount,
}
