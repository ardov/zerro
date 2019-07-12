import { createSlice } from 'redux-starter-kit'

// INITIAL STATE
const initialState = 0

// SLICE
const { reducer } = createSlice({
  slice: 'serverTimestamp',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getLastSyncTime = state => state.data.serverTimestamp * 1000
