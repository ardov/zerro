import { RootState } from 'models'

// SELECTORS
export const getReminders = (state: RootState) => state.data.current.reminder
