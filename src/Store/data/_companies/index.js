import { createSlice } from 'redux-starter-kit'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'companies',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getCompanies = state => state.data.company
