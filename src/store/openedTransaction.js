import { createSlice } from 'redux-starter-kit'

const { reducer, actions, selectors } = createSlice({
  slice: 'openedTransaction',
  initialState: [],
  reducers: {
    openTransaction: (state, { payload }) => payload,
    closeTransaction: () => null,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { openTransaction, closeTransaction } = actions

// SELECTORS
export const getOpenedId = selectors.getOpenedTransaction
