import { createSlice } from 'redux-starter-kit'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'reminderMarkers',
  initialState,
  reducers: {},
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getReminderMarkers = state => state.data.reminderMarker
