import { createSlice } from 'redux-starter-kit'
import { getTransactions } from './data/transactions'
import sendEvent from 'helpers/sendEvent'

const { reducer, actions, selectors } = createSlice({
  slice: 'selectedTransactions',
  initialState: [],
  reducers: {
    checkTransaction: (state, { payload }) => [...state, payload],
    checkTransactions: (state, { payload }) => payload,
    uncheckTransaction: (state, { payload }) =>
      state.filter(id => id !== payload),
    uncheckAllTransactions: () => [],
    toggleTransaction: (state, { payload }) => {
      if (state.includes(payload)) {
        return state.filter(id => id !== payload)
      } else {
        return [...state, payload]
      }
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
export const {
  checkTransaction,
  checkTransactions,
  uncheckTransaction,
  uncheckAllTransactions,
  toggleTransaction,
} = actions

// SELECTORS
export const getSelectedIds = selectors.getSelectedTransactions

// THUNKS
export const selectTransactionsByChangedDate = date => (dispatch, getState) => {
  sendEvent('Transaction: select similar')
  const state = getState()
  const transactions = getTransactions(state)
  const ids = Object.values(transactions)
    .filter(tr => tr.changed === +date)
    .map(tr => tr.id)
  dispatch(checkTransactions(ids))
}
