import { toISODate, toISOMonth } from '6-shared/helpers/date'
import type { RootState } from 'store'

export const selectReminderSlice = (state: RootState) =>
  state.data.current.reminder
export const selectTagBudgetSlice = (state: RootState) =>
  state.data.current.budget
export const selectAccountSlice = (state: RootState) =>
  state.data.current.account
export const selectInstrumentSlice = (state: RootState) =>
  state.data.current.instrument
export const selectMerchantSlice = (state: RootState) =>
  state.data.current.merchant
export const selectUserSlice = (state: RootState) => state.data.current.user
export const selectTagSlice = (state: RootState) => state.data.current.tag
export const selectTransactionSlice = (state: RootState) =>
  state.data.current.transaction

export const selectCurrentMonth = () => toISOMonth(Date.now())
export const selectCurrentDate = () => toISODate(Date.now())
