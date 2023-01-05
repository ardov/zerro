import { useAppSelector } from '@store/index'
import { getUserSettings, patchUserSettings } from './userSettings'

export type { TUserSettings, TUserSettingsPatch } from './userSettings'

export const userSettingsModel = {
  // Selectors
  getUserSettings,

  // Hooks
  useUserSettings: () => useAppSelector(getUserSettings),

  // Thunk
  patchUserSettings,
}