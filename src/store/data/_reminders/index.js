import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData, updateDataFunc } from 'store/data/commonActions'
import { convertToSyncArray } from 'Utils/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const { reducer } = createSlice({
  slice: 'reminder',
  initialState,
  reducers: {},
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      updateDataFunc(state, payload, 'reminder')
    },
  },
})

// REDUCER
export default reducer

// ACTIONS
// ...

// SELECTORS
export const getReminders = state => state.data.reminder
export const getRemindersToSave = createSelector(
  [getReminders],
  reminders => convertToSyncArray(reminders)
)
