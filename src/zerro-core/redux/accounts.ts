import { createSelector } from '@reduxjs/toolkit'
import { useAppSelector } from 'store'
import type { RootState } from 'store'
import {
  getAccounts,
  getDebtAccountId,
  getPopulatedAccounts,
} from '../domain/zenmoney'
import { ZERRO_DATA_ACCOUNT_NAME } from '../constants'
import * as instruments from './instruments'
import { selectAccountSlice } from './state'

export const selectDebtAccountId = createSelector(
  [selectAccountSlice],
  account => getDebtAccountId({ account })
)
export const selectAll = (state: RootState) =>
  getAccounts({ account: selectAccountSlice(state) })
const selectPopulated = createSelector(
  [selectAccountSlice, instruments.selectCodeMap],
  (account, instrumentCodeById) =>
    getPopulatedAccounts({ account }, instrumentCodeById)
)
const selectList = createSelector([selectPopulated], accounts =>
  Object.values(accounts)
)
const selectInBudget = createSelector([selectList], accounts =>
  accounts.filter(account => account.inBudget)
)
const selectSaving = createSelector([selectList], accounts =>
  accounts.filter(
    account =>
      !account.inBudget &&
      account.type !== 'debt' &&
      account.title !== ZERRO_DATA_ACCOUNT_NAME
  )
)
export const useAll = () => useAppSelector(selectAll)
export const usePopulated = () => useAppSelector(selectPopulated)
export const useInBudget = () => useAppSelector(selectInBudget)
export const useSaving = () => useAppSelector(selectSaving)
export { setAccountInBalance as setInBalance } from './commands'
export type { TAccountPopulated } from '../domain/zenmoney'
