import type { TDataStore } from '../../zenmoney/store'
import type { TCoreContext, TIntentPatch } from '../../../types'
import { compileSetSimpleHiddenData, HiddenDataType } from '../hidden-data'
import { getStoredUserSettings } from './read'
import type { TUserSettingsPatch } from './types'

export function compilePatchUserSettings(
  data: TDataStore,
  update: TUserSettingsPatch,
  ctx: TCoreContext
): TIntentPatch {
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
