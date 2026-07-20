import {
  getSimpleHiddenData,
  HiddenDataType,
  THiddenDataSource,
} from '../hidden-data'
import type { TStoredUserSettings, TUserSettings } from './types'

export const DEFAULT_USER_SETTINGS: TUserSettings = {
  sawMigrationAlert: false,
  preferZmBudgets: false,
  emojiIcons: false,
}

export function getStoredUserSettings(
  data: THiddenDataSource
): TStoredUserSettings {
  return getSimpleHiddenData<TStoredUserSettings>(
    data,
    HiddenDataType.UserSettings,
    {}
  )
}

export function getUserSettings(data: THiddenDataSource): TUserSettings {
  const raw = getStoredUserSettings(data)

  return {
    sawMigrationAlert:
      raw.sawMigrationAlert ?? DEFAULT_USER_SETTINGS.sawMigrationAlert,
    preferZmBudgets:
      raw.preferZmBudgets ?? DEFAULT_USER_SETTINGS.preferZmBudgets,
    emojiIcons: raw.emojiIcons ?? DEFAULT_USER_SETTINGS.emojiIcons,
  }
}
