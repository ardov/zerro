import { useAppSelector } from '@store/index'
import {
  getUserSettings,
  patchUserSettings,
  resetUserSettings,
} from './userSettings'

export type { TUserSettings, TUserSettingsPatch } from './userSettings'

export const userSettingsModel = {
  // Selectors
  get: getUserSettings,

  // Hooks
  useUserSettings: () => useAppSelector(getUserSettings),

  // Thunk
  patch: patchUserSettings,
  reset: resetUserSettings,
}
