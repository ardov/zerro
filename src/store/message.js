import { createSlice } from 'redux-starter-kit'

// INITIAL STATE
const initialState = null

// SLICE
const { reducer, actions, selectors } = createSlice({
  slice: 'message',
  initialState,
  reducers: {
    setMessage: (state, { payload }) => payload,
    removeMessage: () => initialState,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setMessage, removeMessage } = actions

// SELECTORS
export const getMessage = selectors.getMessage
