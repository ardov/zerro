import selectors from './selectors'
import thunks from './thunks'
import { createSlice } from 'redux-starter-kit'
import {
  wipeData,
  updateData,
  removeSynced,
  removeSyncedFunc,
} from 'store/data/commonActions'
import { convertDatesToMs } from 'Utils/converters'

// INITIAL STATE
const initialState = { server: {}, diff: {} }

// SLICE
const { reducer, actions } = createSlice({
  slice: 'transactions',
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
      if (payload.transaction) {
        payload.transaction.forEach(item => {
          server[item.id] = convertDatesToMs(item)
        })
      }
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
