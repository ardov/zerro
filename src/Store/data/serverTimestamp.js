import { createSlice } from 'redux-starter-kit'
import { wipeData, updateData } from 'store/data/commonActions'

// INITIAL STATE
const initialState = 0

// SLICE
const { reducer } = createSlice({
  slice: 'serverTimestamp',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => payload.serverTimestamp,
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getLastSyncTime = state => state.data.serverTimestamp * 1000
