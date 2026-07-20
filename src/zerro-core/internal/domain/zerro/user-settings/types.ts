export type TUserSettings = {
  sawMigrationAlert: boolean
  preferZmBudgets: boolean
  emojiIcons: boolean
}

export type TStoredUserSettings = Partial<TUserSettings>
export type TUserSettingsPatch = Partial<TUserSettings>
