import { useAppSelector } from 'store/index'
import { getUserSettings } from './userSettings'

export type { TUserSettings } from './userSettings'

export const userSettingsModel = {
  // Selectors
  get: getUserSettings,

  // Hooks
  useUserSettings: () => useAppSelector(getUserSettings),
}
