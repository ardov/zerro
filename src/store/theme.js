import { createSlice } from 'redux-starter-kit'

// INITIAL STATE
const initialState = 'light'

// SLICE
const { reducer, actions, selectors } = createSlice({
  slice: 'theme',
  initialState,
  reducers: {
    toggle: state => (state === 'light' ? 'dark' : 'light'),
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { toggle } = actions

// SELECTORS
export const getTheme = selectors.getTheme
