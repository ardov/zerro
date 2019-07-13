import { createSlice } from 'redux-starter-kit'
import { wipeData, updateData } from 'store/data/commonActions'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'reminderMarkers',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      if (payload.reminderMarker) {
        payload.reminderMarker.forEach(item => (state[item.id] = item))
      }
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getReminderMarkers = state => state.data.reminderMarker
