export { setEmojiIcons, setPreferZmBudgets } from './commands'
import { createSelector } from '@reduxjs/toolkit'
import { useAppSelector } from 'store'
import { getUserSettings } from '../domain/zerro'
import { selectReminderSlice } from './state'

export const select = createSelector([selectReminderSlice], reminder =>
  getUserSettings({ reminder })
)
export const use = () => useAppSelector(select)
