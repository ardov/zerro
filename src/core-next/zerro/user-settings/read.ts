import type { TDataStore } from '6-shared/types'
import { getSimpleHiddenData, HiddenDataType } from '../hidden-data'

export type TUserSettings = {
  sawMigrationAlert: boolean
  preferZmBudgets: boolean
  emojiIcons: boolean
}

export type TStoredUserSettings = Partial<TUserSettings>

export const DEFAULT_USER_SETTINGS: TUserSettings = {
  sawMigrationAlert: false,
  preferZmBudgets: false,
  emojiIcons: false,
}

export function getStoredUserSettings(data: TDataStore): TStoredUserSettings {
  return getSimpleHiddenData<TStoredUserSettings>(
    data,
    HiddenDataType.UserSettings,
    {}
  )
}

export function getUserSettings(data: TDataStore): TUserSettings {
  const raw = getStoredUserSettings(data)

  return {
    sawMigrationAlert:
      raw.sawMigrationAlert ?? DEFAULT_USER_SETTINGS.sawMigrationAlert,
    preferZmBudgets: raw.preferZmBudgets ?? DEFAULT_USER_SETTINGS.preferZmBudgets,
    emojiIcons: raw.emojiIcons ?? DEFAULT_USER_SETTINGS.emojiIcons,
  }
}
