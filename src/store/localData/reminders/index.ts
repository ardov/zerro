import { createSlice, createSelector } from '@reduxjs/toolkit'
import { wipeData, updateData, removeSyncedFunc } from 'store/commonActions'
import { convertToSyncArray } from 'helpers/converters'
import { Reminder } from 'types'
import { RootState } from 'store'

// INITIAL STATE
const initialState = {} as {
  [key: string]: Reminder
}

// SLICE
const slice = createSlice({
  name: 'reminder',
  initialState,
  reducers: {
    setReminder: (state, { payload }) => {
      const reminders = Array.isArray(payload)
        ? (payload as Reminder[])
        : ([payload] as Reminder[])
      reminders.forEach(reminder => {
        state[reminder.id] = reminder
      })
    },
  },
  extraReducers: builder => {
    builder
      .addCase(wipeData, () => initialState)
      .addCase(updateData, (state, { payload }) => {
        removeSyncedFunc(state, payload.syncStartTime)
      })
  },
})

// REDUCER
export default slice.reducer

// ACTIONS
export const { setReminder } = slice.actions

// SELECTORS
const getServerReminders = (state: RootState) => state.serverData.reminder
const getChangedReminders = (state: RootState) => state.localData.reminder

export const getReminders = createSelector(
  [getServerReminders, getChangedReminders],
  (serverReminders, changedReminders) => ({
    ...serverReminders,
    ...changedReminders,
  })
)

export const getRemindersToSync = (state: RootState) =>
  convertToSyncArray(getChangedReminders(state))
