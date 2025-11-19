import {
  HiddenDataType,
  makeSimpleHiddenStore,
} from '5-entities/shared/hidden-store'
import { createSelector } from '@reduxjs/toolkit'
import { keys } from '6-shared/helpers/keys'
import { AppThunk, TSelector } from 'store'

export type TUserSettings = {
  /** Shows if user already closed notification about migration from 0 to 1 version */
  sawMigrationAlert: boolean

  /** This flag determines which budgets to use */
  preferZmBudgets: boolean

  /** Use SVG icons instead of emoji for tags/categories */
  emojiIcons: boolean
}
export type TUserSettingsPatch = Partial<TUserSettings>
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

export const patchUserSettings =
  (update: TUserSettingsPatch): AppThunk =>
  (dispatch, getState) => {
    const currentData = userSettingsStore.getData(getState())
    const newData = { ...currentData, ...update }

    // Remove undefined keys
    keys(newData).forEach(key => {
      if (newData[key] === undefined) delete newData[key]
    })

    dispatch(userSettingsStore.setData(newData))
  }

export const resetUserSettings = userSettingsStore.resetData
