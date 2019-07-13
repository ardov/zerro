import selectors from './selectors'
import thunks from './thunks'
import { createSlice } from 'redux-starter-kit'
import { wipeData, updateData } from 'store/data/commonActions'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'transactions',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      if (payload.transaction) {
        payload.transaction.forEach(item => (state[item.id] = item))
      }
    },
  },
})

// REDUCER
export default reducer

// SELECTORS
export const {
  getTransactionsToSave,
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getRawTransaction,
  getPopulatedTransaction,
  getTransactionList,
  getOpenedTransaction,
  getTransactionList2,
} = selectors

// THUNKS
export const {
  deleteTransactions,
  restoreTransaction,
  splitTransfer,
  applyChangesToTransaction,
  setMainTagToTransactions,
} = thunks
