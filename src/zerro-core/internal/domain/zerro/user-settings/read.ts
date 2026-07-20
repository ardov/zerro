import { getSimpleHiddenData, HiddenDataType } from '../hidden-data'
import type { ById } from '../../foundation/types'
import type { TReminder } from '../../zenmoney/entities/reminders'
import type { TStoredUserSettings, TUserSettings } from './types'

export const DEFAULT_USER_SETTINGS: TUserSettings = {
  sawMigrationAlert: false,
  preferZmBudgets: false,
  emojiIcons: false,
}

export function getStoredUserSettings(
  reminders: ById<TReminder>
): TStoredUserSettings {
  return getSimpleHiddenData<TStoredUserSettings>(
    reminders,
    HiddenDataType.UserSettings,
    {}
  )
}

export function getUserSettings(reminders: ById<TReminder>): TUserSettings {
  const raw = getStoredUserSettings(reminders)

  return {
    sawMigrationAlert:
      raw.sawMigrationAlert ?? DEFAULT_USER_SETTINGS.sawMigrationAlert,
    preferZmBudgets:
      raw.preferZmBudgets ?? DEFAULT_USER_SETTINGS.preferZmBudgets,
    emojiIcons: raw.emojiIcons ?? DEFAULT_USER_SETTINGS.emojiIcons,
  }
}
