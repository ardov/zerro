import { createSlice } from 'redux-starter-kit'

const { reducer, actions, selectors } = createSlice({
  slice: 'lastSync',
  initialState: { isSuccessful: null, finishedAt: 0, errorMessage: null },
  reducers: {
    setSyncData: (state, action) => ({ ...state, ...action.payload }),
  },
})

// REDUCER
export default reducer

// ACTIONS
export const { setSyncData } = actions

// SELECTORS
export const getLastSyncInfo = selectors.getLastSync
