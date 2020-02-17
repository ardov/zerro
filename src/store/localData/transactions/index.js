import selectors from './selectors'
import { createSlice } from 'redux-starter-kit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
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
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      removeSyncedFunc(state, payload.syncStartTime)
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
  getSortedTransactions,
} = selectors
