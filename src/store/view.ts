import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { TISODate } from '6-shared/types'
import type { core } from 'zerro-core/redux'
import type { RootState } from 'store'

export type TTransactionsPageView = {
  query: core.transactions.TTransactionQuery
  search: string
  topDate: TISODate | null
}

export type TViewState = {
  transactionsPage: TTransactionsPageView
}

function createInitialState(): TViewState {
  return {
    transactionsPage: {
      query: { clauses: [] },
      search: '',
      topDate: null,
    },
  }
}

const { reducer, actions } = createSlice({
  name: 'view',
  initialState: createInitialState(),
  reducers: {
    patchTransactionsPage: (
      state,
      action: PayloadAction<Partial<TTransactionsPageView>>
    ) => {
      Object.assign(state.transactionsPage, action.payload)
    },
    resetViews: () => createInitialState(),
  },
})

export default reducer

export const { patchTransactionsPage, resetViews } = actions

export const selectTransactionsPageView = (state: RootState) =>
  state.view.transactionsPage
