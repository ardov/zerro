import { createSlice } from 'redux-starter-kit'

const { reducer, actions, selectors } = createSlice({
  slice: 'selectedTransactions',
  initialState: [],
  reducers: {
    checkTransaction: (state, { payload }) => [...state, payload],
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
  uncheckTransaction,
  uncheckAllTransactions,
  toggleTransaction,
} = actions

// SELECTORS
export const getSelectedIds = selectors.getSelectedTransactions
