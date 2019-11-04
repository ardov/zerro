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
      const converter = raw => convertDatesToMs(hydrate(raw))
      updateDataFunc(server, payload, 'transaction', converter, null)
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
  getOpenedTransaction,
  getTransactionList,
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
