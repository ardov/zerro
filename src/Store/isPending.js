import { createSlice } from 'redux-starter-kit'

const { reducer, actions, selectors } = createSlice({
  slice: 'isPending',
  initialState: false,
  reducers: {
    setPending: (state, action) => !!action.payload,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setPending } = actions

// SELECTORS
export const { getIsPending } = selectors
