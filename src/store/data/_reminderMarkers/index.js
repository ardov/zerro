import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData, updateDataFunc } from 'store/data/commonActions'
import { convertToSyncArray } from 'Utils/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'reminderMarker',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      updateDataFunc(state, payload, 'reminderMarker')
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getReminderMarkers = state => state.data.reminderMarker
export const getReminderMarkersToSave = createSelector(
  [getReminderMarkers],
  reminderMarkers => convertToSyncArray(reminderMarkers)
)
