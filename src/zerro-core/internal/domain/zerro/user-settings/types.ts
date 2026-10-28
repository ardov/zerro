export type TUserSettings = {
  sawMigrationAlert: boolean
  preferZmBudgets: boolean
}

export type TStoredUserSettings = Partial<TUserSettings>
export type TUserSettingsPatch = Partial<TUserSettings>
