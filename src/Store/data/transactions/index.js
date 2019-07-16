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
import { convertDatesToMs } from 'Utils/converters'

// INITIAL STATE
const initialState = { server: {}, diff: {} }

// SLICE
const { reducer, actions } = createSlice({
  slice: 'transaction',
  initialState,
  reducers: {
    setTransaction: ({ diff }, { payload }) => {
      if (Array.isArray(payload)) {
        payload.forEach(tr => (diff[tr.id] = tr))
      } else {
        diff[payload.id] = payload
      }
    },
    removeTransaction: ({ diff }, { payload }) => {
      delete diff[payload]
    },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [removeSynced]: ({ diff }, { payload }) => {
      removeSyncedFunc(diff, payload)
    },
    [updateData]: ({ server }, { payload }) => {
      updateDataFunc(server, payload, 'transaction', convertDatesToMs, null)
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setTransaction, removeTransaction } = actions

// SELECTORS
export const {
  getTransactionsToSave,
  getTransactionsToSync,
  getPopulatedTransactions,
  getTransactions,
  getTransaction,
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
