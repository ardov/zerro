import selectors from './selectors'
import { createSlice } from 'redux-starter-kit'
import { wipeData, removeSynced, removeSyncedFunc } from 'store/commonActions'
import makeTransaction from './makeTransaction'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer, actions } = createSlice({
  slice: 'transaction',
  initialState,
  reducers: {
    setTransaction: (state, { payload }) => {
      if (Array.isArray(payload))
        payload.forEach(tr => {
          state[tr.id] = makeTransaction(tr)
        })
      else state[payload.id] = makeTransaction(payload)
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
  getTransactionList,
  getSortedTransactions,
  getMainTransactionList,
} = selectors
