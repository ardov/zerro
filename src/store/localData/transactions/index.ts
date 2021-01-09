import { selectors } from './selectors'
import { createSlice } from '@reduxjs/toolkit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import makeTransaction, { TransactionDraft } from './makeTransaction'
import { Transaction } from 'types'

// INITIAL STATE
const initialState = {} as {
  [key: string]: Transaction
}

// SLICE
const { reducer, actions } = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransaction: (state, { payload }) => {
      const transactions = Array.isArray(payload)
        ? (payload as TransactionDraft[])
        : ([payload] as TransactionDraft[])

      transactions.forEach(draft => {
        const transaction = makeTransaction(draft)
        state[transaction.id] = transaction
      })
    },
  },
  extraReducers: builder => {
    builder
      .addCase(wipeData, () => initialState)
      .addCase(updateData, (state, { payload }) => {
        removeSyncedFunc(state, payload.syncStartTime)
      })
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setTransaction } = actions

// SELECTORS
export const {
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
  getSortedTransactions,
  getTransactionsHistory,
} = selectors
