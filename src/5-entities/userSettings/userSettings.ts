import {
  HiddenDataType,
  makeSimpleHiddenStore,
} from '5-entities/shared/hidden-store'
import { createSelector } from '@reduxjs/toolkit'
import { TSelector } from 'store'

export type TUserSettings = {
  /** Shows if user already closed notification about migration from 0 to 1 version */
  sawMigrationAlert: boolean

  /** This flag determines which budgets to use */
  preferZmBudgets: boolean

  /** Use SVG icons instead of emoji for tags/categories */
  emojiIcons: boolean
}
export type TStoredUserSettings = Partial<TUserSettings>

const userSettingsStore = makeSimpleHiddenStore<TStoredUserSettings>(
  HiddenDataType.UserSettings,
  {}
)

export const getUserSettings: TSelector<TUserSettings> = createSelector(
  [userSettingsStore.getData],
  raw => ({
    sawMigrationAlert: raw.sawMigrationAlert ?? false,
    preferZmBudgets: raw.preferZmBudgets ?? false,
    emojiIcons: raw.emojiIcons ?? false,
  })
)
