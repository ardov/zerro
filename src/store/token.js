import { createSlice } from 'redux-starter-kit'

const { reducer, actions, selectors } = createSlice({
  slice: 'token',
  initialState: null,
  reducers: {
    setToken: (state, action) => action.payload,
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setToken } = actions

// SELECTORS
export const { getToken } = selectors
export const getLoginState = state => !!getToken(state)
