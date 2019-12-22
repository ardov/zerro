import selectors from './selectors'
import thunks from './thunks'
import { createSlice } from 'redux-starter-kit'
import {
  wipeData,
  updateData,
  removeSynced,
  removeSyncedFunc,
  updateDataFunc,
} from 'store/data/commonActions'
import { convertDatesToMs } from 'helpers/converters'
import hydrate from './hydrate'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer, actions } = createSlice({
  slice: 'transaction',
  initialState,
  reducers: {
    setTransaction: (state, { payload }) => {
      if (Array.isArray(payload)) {
        payload.forEach(tr => (state[tr.id] = tr))
      } else {
        state[payload.id] = payload
      }
    },
    // removeTransaction: (state, { payload }) => {
    //   delete state[payload]
    // },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [removeSynced]: (state, { payload }) => {
      removeSyncedFunc(state, payload)
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setTransaction, removeTransaction } = actions

// SELECTORS
export const {
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
  getPopulatedTransaction,
  getOpenedTransaction,
  getTransactionList,
  getSortedTransactions,
  getMainTransactionList,
} = selectors

// THUNKS
export const {
  deleteTransactions,
  restoreTransaction,
  splitTransfer,
  applyChangesToTransaction,
  setMainTagToTransactions,
} = thunks
