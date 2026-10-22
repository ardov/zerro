import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { TISODate } from '@/6-shared/types'
import type { core } from '@/zerro-core/redux'
import type { RootState } from '@/store'

export type TTransactionsPageView = {
  query: core.transactions.TTransactionQuery
  search: string
  topDate: TISODate | null
}

export type TViewState = {
  /** Bumped by every reset, so a save scheduled before it can be told apart. */
  generation: number
  transactionsPage: TTransactionsPageView
}

function createInitialState(generation = 0): TViewState {
  return {
    generation,
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
    saveTransactionsTopDate: (
      state,
      action: PayloadAction<{ topDate: TISODate; generation: number }>
    ) => {
      if (action.payload.generation !== state.generation) return
      state.transactionsPage.topDate = action.payload.topDate
    },
    resetViews: state => createInitialState(state.generation + 1),
  },
})

export default reducer

export const { patchTransactionsPage, saveTransactionsTopDate, resetViews } =
  actions

export const selectTransactionsPageView = (state: RootState) =>
  state.view.transactionsPage
export const selectViewGeneration = (state: RootState) => state.view.generation
