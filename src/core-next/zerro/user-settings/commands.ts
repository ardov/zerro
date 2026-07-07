import type { TDataStore } from '6-shared/types'
import type { TCoreContext, TNormalizedPatch } from '../../types'
import {
  compileResetSimpleHiddenData,
  compileSetSimpleHiddenData,
  HiddenDataType,
} from '../hidden-data'
import { getStoredUserSettings, type TUserSettings } from './read'

export type TUserSettingsPatch = Partial<TUserSettings>

export function compilePatchUserSettings(
  data: TDataStore,
  update: TUserSettingsPatch,
  ctx: Pick<TCoreContext, 'now' | 'uuid'>
): TNormalizedPatch {
  const payload = { ...getStoredUserSettings(data), ...update }

  Object.keys(payload).forEach(key => {
    const settingKey = key as keyof TUserSettingsPatch
    if (payload[settingKey] === undefined) delete payload[settingKey]
  })

  return compileSetSimpleHiddenData(
    data,
    HiddenDataType.UserSettings,
    payload,
    ctx
  )
}

export function compileResetUserSettings(
  data: TDataStore,
  ctx: Pick<TCoreContext, 'now'>
): TNormalizedPatch {
  return compileResetSimpleHiddenData(data, HiddenDataType.UserSettings, ctx)
}
