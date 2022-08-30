import { RootState } from '@store'

// SELECTORS
export const getReminders = (state: RootState) => state.data.current.reminder
