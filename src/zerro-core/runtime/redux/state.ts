import type { RootState } from 'store'

export const selectAccountSlice = (state: RootState) =>
  state.data.current.account
export const selectBudgetSlice = (state: RootState) => state.data.current.budget
export const selectInstrumentSlice = (state: RootState) =>
  state.data.current.instrument
export const selectMerchantSlice = (state: RootState) =>
  state.data.current.merchant
export const selectUserSlice = (state: RootState) => state.data.current.user
export const selectTagSlice = (state: RootState) => state.data.current.tag
export const selectTransactionSlice = (state: RootState) =>
  state.data.current.transaction
