import {
  HiddenDataType,
  makeSimpleHiddenStore,
} from '@entities/shared/hidden-store'
import { keys } from '@shared/helpers/keys'
import { AppThunk } from '@store'

export type TUserSettings = Partial<{
  /** Shows if user already closed notification about migration from 0 to 1 version */
  sawMigrationAlert: boolean

  /** This flag determines which budgets to use */
  useZmBudgets: boolean
}>

const userSettingsStore = makeSimpleHiddenStore<TUserSettings>(
  HiddenDataType.UserSettings,
  {}
)

export const getUserSettings = userSettingsStore.getData

export type TUserSettingsPatch = TUserSettings

export const patchUserSettings =
  (update: TUserSettingsPatch): AppThunk =>
  (dispatch, getState) => {
    const currentData = getUserSettings(getState())
    const newData = { ...currentData, ...update }

    // Remove undefined keys
    keys(newData).forEach(key => {
      if (update[key] === undefined) delete newData[key]
    })

    dispatch(userSettingsStore.setData(newData))
  }
