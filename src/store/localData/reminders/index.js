import { createSlice, createSelector } from 'redux-starter-kit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import { convertToSyncArray } from 'helpers/converters'

// INITIAL STATE
const initialState = {}

// SLICE
const slice = createSlice({
  slice: 'reminder',
  initialState,
  reducers: {
    setReminder: (state, { payload }) => {
      const reminders = Array.isArray(payload) ? payload : [payload]
      reminders.forEach(reminder => {
        state[reminder.id] = reminder
      })
    },
  },
  extraReducers: {
    [wipeData]: () => initialState,
    [updateData]: (state, { payload }) => {
      removeSyncedFunc(state, payload.syncStartTime)
    },
  },
})

// REDUCER
export default slice.reducer

// ACTIONS
export const { setReminder } = slice.actions

// SELECTORS
const getServerReminders = state => state.serverData.reminder
const getChangedReminders = state => state.localData.reminder

export const getReminders = createSelector(
  [getServerReminders, getChangedReminders],
  (serverReminders, changedReminders) => ({
    ...serverReminders,
    ...changedReminders,
  })
)

export const getRemindersToSync = state =>
  convertToSyncArray(getChangedReminders(state))
